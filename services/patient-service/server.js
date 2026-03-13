const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Storage } = require('@google-cloud/storage');

const app = express();

// 🌩️ Google Cloud Storage Setup
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'alzheimer-patient-images';
const storageGCS = new Storage();
const bucket = storageGCS.bucket(BUCKET_NAME);

// 🛡️ Helper for GCS Upload
const uploadToGCS = (file) => new Promise((resolve, reject) => {
  if (!file) return resolve(null);
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const blobName = uniqueSuffix + path.extname(file.originalname);
  const blob = bucket.file(blobName);
  const blobStream = blob.createWriteStream({ resumable: false, gzip: true, metadata: { contentType: file.mimetype } });
  blobStream.on('error', (err) => reject(err));
  blobStream.on('finish', () => resolve(`/uploads/${blobName}`));
  blobStream.end(file.buffer);
});

const deleteFromGCS = async (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
  try { await bucket.file(path.basename(imageUrl)).delete(); } catch (err) { console.error("GCS Delete Error:", err.message); }
};

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/patients/health', (req, res) => res.json({ status: "ok", bucket: BUCKET_NAME }));

// Image Serving
app.get('/uploads/:filename', async (req, res) => {
  const fileName = req.params.filename;
  try {
    const file = bucket.file(fileName);
    const [exists] = await file.exists();
    if (exists) file.createReadStream().pipe(res);
    else res.status(404).json({ error: "Not found" });
  } catch (err) { res.status(500).json({ error: "GCS Error", details: err.message }); }
});

// Database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alzheimer_db';
mongoose.connect(MONGODB_URI).then(() => console.log('✅ Connected to MongoDB')).catch(err => console.error('❌ MongoDB Error:', err));

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

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// --- API Routes ---

// 1. Get All
app.get('/api/patients', async (req, res) => {
  try { res.json(await Patient.find()); } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Create (Restored!)
app.post('/api/patients', async (req, res) => {
  try {
    const { id_card, name, age, gender, general_notes } = req.body;
    const patient = new Patient({ id_card, name, age, gender, general_notes });
    await patient.save();
    res.status(201).json(patient);
  } catch (e) { res.status(400).json({ error: "Patient creation failed", details: e.message }); }
});

// 3. Upload AI Result
app.post('/api/patients/upload', upload.single('image'), async (req, res) => {
  try {
    const imageUrl = await uploadToGCS(req.file);
    
    // 🛡️ Fix: Use || 0 to prevent NaN (Not a Number) errors in MongoDB
    const probability = parseFloat(req.body.probability) || 0;
    const duration = parseFloat(req.body.duration) || 0;
    const diagnosis = req.body.diagnosis || 'Initial';
    const notes = req.body.notes || '';

    const updateData = { 
      $push: { 
        history: { 
          diagnosis, 
          probability, 
          notes, 
          image_url: imageUrl, 
          duration 
        } 
      } 
    };
    const existing = await Patient.findOne({ id_card: req.body.id_card });
    if (!existing || !existing.profile_pic) updateData.$set = { profile_pic: imageUrl };
    if (!existing) updateData.$setOnInsert = { name: req.body.name, created_at: new Date() };
    const patient = await Patient.findOneAndUpdate({ id_card: req.body.id_card }, updateData, { new: true, upsert: true });
    res.json({ message: "Success", patient, imageUrl });
  } catch (e) { res.status(500).json({ error: "Upload failed", details: e.message }); }
});

// 4. Get by ID
app.get('/api/patients/:id', async (req, res) => {
  const p = await Patient.findOne({ id_card: req.params.id });
  p ? res.json(p) : res.status(404).json({ error: "Not found" });
});

// 5. Update
app.put('/api/patients/:id', async (req, res) => {
  try {
    const p = await Patient.findOneAndUpdate({ id_card: req.params.id }, { $set: req.body }, { new: true });
    res.json(p);
  } catch (e) { res.status(400).json({ error: "Update failed" }); }
});

// 6. Delete
app.delete('/api/patients/:id', async (req, res) => {
  const p = await Patient.findOneAndDelete({ id_card: req.params.id });
  if (p?.history) for (const h of p.history) await deleteFromGCS(h.image_url);
  res.json({ message: "Deleted" });
});

// 7. Clear History
app.post('/api/patients/:id/clear-history', async (req, res) => {
  const p = await Patient.findOne({ id_card: req.params.id });
  if (!p) return res.status(404).json({ error: "Not found" });
  const toDelete = p.history.filter(h => h.diagnosis !== "Initial");
  for (const h of toDelete) await deleteFromGCS(h.image_url);
  p.history = p.history.filter(h => h.diagnosis === "Initial");
  await p.save();
  res.json(p);
});

// 8. Analytics (Restored basic version)
app.get('/api/patients/analytics/summary', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json({ kpi: { totalPatients: patients.length }, recentActivities: [] });
  } catch (e) { res.status(500).json({ error: "Analytics failed" }); }
});

app.listen(8080, '0.0.0.0', () => console.log(`Patient Service online on 8080`));
