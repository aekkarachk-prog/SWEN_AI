const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');
const { Storage } = require('@google-cloud/storage');

const app = express();

// 🌩️ Google Cloud Storage Setup
const BUCKET_NAME = process.env.GCS_BUCKET_NAME;
const storageGCS = new Storage();

const uploadToGCS = (file) => new Promise((resolve, reject) => {
  if (!BUCKET_NAME) return reject(new Error("GCS_BUCKET_NAME missing"));
  if (!file) return resolve(null);
  const bucket = storageGCS.bucket(BUCKET_NAME);
  const blobName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
  const blob = bucket.file(blobName);
  const blobStream = blob.createWriteStream({ resumable: false, gzip: true, metadata: { contentType: file.mimetype } });
  blobStream.on('error', (err) => reject(err));
  blobStream.on('finish', () => resolve(`/uploads/${blobName}`));
  blobStream.end(file.buffer);
});

const deleteFromGCS = async (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('/uploads/') || !BUCKET_NAME) return;
  try { await storageGCS.bucket(BUCKET_NAME).file(path.basename(imageUrl)).delete(); } catch (err) {}
};

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/patients/health', (req, res) => res.json({ status: "ok", bucket: BUCKET_NAME }));

app.get('/uploads/:filename', async (req, res) => {
  if (!BUCKET_NAME) return res.status(500).json({ error: "GCS not configured" });
  const fileName = req.params.filename;
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
  try {
    const file = storageGCS.bucket(BUCKET_NAME).file(fileName);
    const [exists] = await file.exists();
    if (exists) {
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      file.createReadStream().pipe(res);
    } else res.status(404).json({ error: "Not found" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alzheimer_db';
mongoose.connect(MONGODB_URI).catch(err => console.error('❌ MongoDB Error:', err));

const Patient = mongoose.model('Patient', new mongoose.Schema({
  id_card: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: Number,
  gender: String,
  profile_pic: String,
  general_notes: String,
  history: [{ diagnosis: String, probability: Number, date: { type: Date, default: Date.now }, notes: String, image_url: String, duration: Number }],
  created_at: { type: Date, default: Date.now }
}));

const upload = multer({ storage: multer.memoryStorage() });

// --- API Routes ---

app.get('/api/patients', async (req, res) => res.json(await Patient.find()));

app.post('/api/patients', async (req, res) => {
  try { const p = new Patient(req.body); await p.save(); res.status(201).json(p); } 
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/patients/upload', upload.single('image'), async (req, res) => {
  try {
    const imageUrl = await uploadToGCS(req.file);
    const updateData = { $push: { history: { diagnosis: req.body.diagnosis || 'Initial', probability: parseFloat(req.body.probability) || 0, notes: req.body.notes || '', image_url: imageUrl, duration: parseFloat(req.body.duration) || 0 } } };
    const existing = await Patient.findOne({ id_card: req.body.id_card });
    if (!existing || !existing.profile_pic) updateData.$set = { profile_pic: imageUrl };
    if (!existing) updateData.$setOnInsert = { name: req.body.name, created_at: new Date() };
    const patient = await Patient.findOneAndUpdate({ id_card: req.body.id_card }, updateData, { new: true, upsert: true });
    res.json({ message: "Success", patient, imageUrl });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/patients/:id', async (req, res) => {
  const p = await Patient.findOne({ id_card: req.params.id });
  p ? res.json(p) : res.status(404).json({ error: "Not found" });
});

app.put('/api/patients/:id', async (req, res) => {
  const p = await Patient.findOneAndUpdate({ id_card: req.params.id }, { $set: req.body }, { new: true });
  res.json(p);
});

app.delete('/api/patients/:id', async (req, res) => {
  const p = await Patient.findOneAndDelete({ id_card: req.params.id });
  if (p?.history) for (const h of p.history) await deleteFromGCS(h.image_url);
  res.json({ message: "Deleted" });
});

// 🚀 RESTORED: Clear History Route
app.post('/api/patients/:id/clear-history', async (req, res) => {
  try {
    const p = await Patient.findOne({ id_card: req.params.id });
    if (!p) return res.status(404).json({ error: "Patient not found" });
    const toDelete = p.history.filter(h => h.diagnosis !== "Initial");
    for (const h of toDelete) await deleteFromGCS(h.image_url);
    p.history = p.history.filter(h => h.diagnosis === "Initial");
    await p.save();
    res.json({ message: "History cleared", patient: p });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 🚀 FULL ANALYTICS LOGIC
app.get('/api/patients/analytics/summary', async (req, res) => {
  try {
    const patients = await Patient.find();
    const totalPatients = patients.length;
    const today = new Date(); 
    today.setHours(0,0,0,0);
    
    let scansToday = 0, totalProb = 0, probCount = 0, totalDuration = 0;
    const dist = { 'Non Demented': 0, 'Very Mild Demented': 0, 'Mild Demented': 0, 'Moderate Demented': 0 };
    const recentActivities = [];

    // --- Age & Gender Profile Analysis ---
    const ageRanges = [
      { label: '0-18', min: 0, max: 18, male: 0, female: 0 },
      { label: '19-35', min: 19, max: 35, male: 0, female: 0 },
      { label: '36-50', min: 36, max: 50, male: 0, female: 0 },
      { label: '51-65', min: 51, max: 65, male: 0, female: 0 },
      { label: '66+', min: 66, max: 150, male: 0, female: 0 }
    ];

    // --- Trend Analysis (Last 6 Months) ---
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ 
        month: d.toLocaleString('en-US', { month: 'short' }), 
        cases: 0, 
        risk: 0,
        fullDate: new Date(d.getFullYear(), d.getMonth(), 1)
      });
    }

    patients.forEach(p => {
      // Age & Gender
      const age = p.age || 0;
      const gender = (p.gender || '').toLowerCase();
      const range = ageRanges.find(r => age >= r.min && age <= r.max);
      if (range) {
        if (gender === 'male') range.male++;
        else if (gender === 'female') range.female++;
      }

      p.history.forEach(h => {
        const hDate = new Date(h.date);
        
        // Scans Today
        if (hDate >= today && h.diagnosis !== 'Initial') scansToday++;
        
        if (h.diagnosis !== 'Initial') {
          // KPI Stats
          if (h.probability) { totalProb += h.probability; probCount++; }
          if (h.duration) totalDuration += h.duration;
          
          // Diagnosis Distribution
          if (dist[h.diagnosis] !== undefined) dist[h.diagnosis]++;
          
          // Trend Data
          const hMonth = hDate.toLocaleString('en-US', { month: 'short' });
          const hYear = hDate.getFullYear();
          const trendMonth = months.find(m => m.month === hMonth && m.fullDate.getFullYear() === hYear);
          if (trendMonth) {
            trendMonth.cases++;
            if (h.diagnosis !== 'Non Demented') trendMonth.risk++;
          }

          // Recent Activities
          recentActivities.push({
            id: h._id, hn: p.id_card, patient: p.name, type: "AI Analysis",
            status: h.diagnosis, time: h.date, alert: h.diagnosis !== 'Non Demented'
          });
        }
      });
    });

    res.json({
      kpi: {
        totalPatients, scansToday, analyzedToday: scansToday,
        accuracy: probCount > 0 ? ((totalProb / probCount) * 100).toFixed(1) + "%" : "0%",
        avgTurnaroundTime: probCount > 0 ? (totalDuration / probCount).toFixed(1) : "0.0",
        patientTrend: totalPatients > 0 ? "+"+Math.floor(totalPatients*0.1) : "+0", 
        scanTrend: scansToday > 0 ? "+"+scansToday : "+0", 
        analyzedTrend: scansToday > 0 ? "+"+scansToday : "+0", 
        accuracyTrend: "+0.1"
      },
      predictionData: [
        { name: 'Non Demented', value: dist['Non Demented'], color: '#10b981' },
        { name: 'Very Mild', value: dist['Very Mild Demented'], color: '#3b82f6' },
        { name: 'Mild', value: dist['Mild Demented'], color: '#f59e0b' },
        { name: 'Moderate', value: dist['Moderate Demented'], color: '#ef4444' }
      ],
      ageData: ageRanges.map(r => ({ range: r.label, male: r.male, female: r.female })),
      recentActivities: recentActivities.sort((a,b) => new Date(b.time) - new Date(a.time)).slice(0, 5),
      trendData: months.map(m => ({ month: m.month, cases: m.cases, risk: m.risk }))
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

if (require.main === module) {
  app.listen(8080, '0.0.0.0', () => console.log(`Patient Service online on 8080`));
}
