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
const storageGCS = new Storage();
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'alzheimer-patient-images';
const bucket = storageGCS.bucket(BUCKET_NAME);

// 🛡️ Helper for GCS Upload
const uploadToGCS = (file) => new Promise((resolve, reject) => {
  if (!file) resolve(null);
  
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const blobName = uniqueSuffix + path.extname(file.originalname);
  const blob = bucket.file(blobName);
  
  const blobStream = blob.createWriteStream({
    resumable: false,
    gzip: true,
    metadata: {
      contentType: file.mimetype,
    }
  });

  blobStream.on('error', (err) => reject(err));
  blobStream.on('finish', () => {
    // Return path consistent with local for easier proxying
    // or return full public URL
    resolve(`/uploads/${blobName}`);
  });

  blobStream.end(file.buffer);
});

// 🛡️ Helper for GCS Delete
const deleteFromGCS = async (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
  try {
    const fileName = path.basename(imageUrl);
    await bucket.file(fileName).delete();
    console.log(`[GCS] Deleted ${fileName}`);
  } catch (err) {
    console.error(`[GCS Error] Failed to delete ${imageUrl}:`, err.message);
  }
};

// 🛡️ Security: Trust proxy (Nginx)
app.set('trust proxy', 1);

// ... (Helmet and limiter code)

app.use(cors());
// 🛡️ Security: Limit body size to prevent DoS attacks
app.use(express.json({ limit: '10mb' })); 

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alzheimer_db';

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 🛡️ Security: Proxy for GCS Files (instead of static serving)
app.get('/uploads/:filename', async (req, res) => {
  const fileName = req.params.filename;
  const localPath = path.join(uploadsDir, fileName);

  // 1. Try local first (for backward compatibility)
  if (fs.existsSync(localPath)) {
    return res.sendFile(localPath);
  }

  // 2. Try GCS
  try {
    const file = bucket.file(fileName);
    const [exists] = await file.exists();
    if (exists) {
      // Redirect to a signed URL or stream it
      // For simplicity, we stream it back
      file.createReadStream().pipe(res);
    } else {
      res.status(404).send('Not Found');
    }
  } catch (err) {
    res.status(500).send('Internal Error');
  }
});

mongoose.connect(MONGODB_URI)
// ... (Model setup)

const Patient = mongoose.model('Patient', patientSchema);

// Switch to memory storage for GCS
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Invalid file type. Only images are allowed."));
  }
});

// --- API Routes ---

// ... (Health and Get All)

// 3. Upload AI Result (Updated for GCS)
app.post('/api/patients/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const id_card = String(req.body.id_card);
    const diagnosis = String(req.body.diagnosis || 'AI Analysis');
    const notes = String(req.body.notes || '');
    const name = String(req.body.name || 'New Patient');
    const probability = parseFloat(req.body.probability) || 0;
    const duration = parseFloat(req.body.duration) || 0;

    // 🚀 Upload to GCS
    const imageUrl = await uploadToGCS(req.file);
    
    const existingPatient = await Patient.findOne({ id_card: id_card });
    const updateData = {
      $push: { history: { 
        diagnosis, 
        probability,
        notes, 
        image_url: imageUrl,
        date: new Date(),
        duration: duration 
      } }
    };

    if (!existingPatient || !existingPatient.profile_pic) {
      updateData.$set = { profile_pic: imageUrl };
    }

    if (!existingPatient) {
      updateData.$setOnInsert = { name, created_at: new Date() };
    }

    const patient = await Patient.findOneAndUpdate(
      { id_card: id_card },
      updateData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "Success", patient, imageUrl });
  } catch (error) {
    console.error("Upload AI error:", error);
    res.status(500).json({ error: 'Internal Server Error during upload' });
  }
});

// ... (Get by ID and Update)

// 5. Delete (Updated for GCS)
app.delete('/api/patients/:id_card', async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ id_card: String(req.params.id_card) });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (patient.history) {
      for (const h of patient.history) {
        if (h.image_url) {
          const fileName = path.basename(h.image_url);
          const localPath = path.join(uploadsDir, fileName);
          
          // Delete local if exists
          if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
          
          // Delete from GCS
          await deleteFromGCS(h.image_url);
        }
      }
    }
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Clear History (Updated for GCS)
app.post('/api/patients/:id_card/clear-history', async (req, res) => {
  try {
    const patient = await Patient.findOne({ id_card: String(req.params.id_card) });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const initialRecords = patient.history.filter(h => 
      h.diagnosis === "Initial" && h.notes === "Uploaded during registration"
    );
    
    const recordsToDelete = patient.history.filter(h => 
      !(h.diagnosis === "Initial" && h.notes === "Uploaded during registration")
    );

    for (const h of recordsToDelete) {
      if (h.image_url) {
        const fileName = path.basename(h.image_url);
        const localPath = path.join(uploadsDir, fileName);
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        await deleteFromGCS(h.image_url);
      }
    }

    patient.history = initialRecords;
    await patient.save();

    res.json({ message: 'History cleared', patient });
  } catch (error) {
    console.error("Clear History Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 7. Analytics Summary
app.get('/api/patients/analytics/summary', async (req, res) => {
  try {
    const patients = await Patient.find();
    
    // --- 1. KPI Stats & Trends ---
    const totalPatients = patients.length;
    
    // MRI scans today vs yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Patients this month vs last month
    const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    let scansToday = 0;
    let scansYesterday = 0;
    let patientsThisMonth = 0;
    let patientsLastMonth = 0;
    let analyzedToday = 0;
    let humanReviewedToday = 0;
    let totalDuration = 0;
    let durationCount = 0;
    let totalProbability = 0;
    let probabilityCount = 0;
    
    patients.forEach(p => {
      // Patient registration trends
      if (p.created_at >= firstOfThisMonth) patientsThisMonth++;
      else if (p.created_at >= firstOfLastMonth && p.created_at < firstOfThisMonth) patientsLastMonth++;

      p.history.forEach(h => {
        const hDate = new Date(h.date);
        const isInitial = h.diagnosis === 'Initial';
        const isDiagnostic = h.diagnosis && !isInitial && h.diagnosis !== 'AI Analysis';

        if (hDate >= today) {
          if (!isInitial) {
            scansToday++; // 🛡️ Only count actual scans/analysis, not initial registrations
          }
          if (isDiagnostic) {
            analyzedToday++;
            if (h.notes && !h.notes.startsWith('AI Confidence:')) {
              humanReviewedToday++;
            }
          }
        }
 else if (hDate >= yesterday && hDate < today) {
          scansYesterday++;
        }

        if (h.duration) {
          totalDuration += h.duration;
          durationCount++;
        }

        if (isDiagnostic && h.probability !== undefined) {
          totalProbability += h.probability;
          probabilityCount++;
        }
      });
    });

    const avgTurnaroundTime = durationCount > 0 ? (totalDuration / durationCount).toFixed(1) : "0.0";
    const accuracyValue = probabilityCount > 0 ? (totalProbability / probabilityCount) * 100 : 0;
    const accuracy = accuracyValue.toFixed(1) + "%";

    // Calculate Trend Percentages
    const calcTrend = (curr, prev) => {
      if (prev === 0) return curr > 0 ? "+100" : "+0";
      const diff = ((curr - prev) / prev) * 100;
      return (diff >= 0 ? "+" : "") + diff.toFixed(0);
    };

    const patientTrend = calcTrend(patientsThisMonth, patientsLastMonth);
    const scanTrend = calcTrend(scansToday, scansYesterday);
    const analyzedTrend = analyzedToday > 0 ? "+10" : "+0"; 
    const accuracyTrend = accuracyValue > 90 ? "+0.2" : "+0.0"; // Simplified proxy trend for accuracy

    // --- 2. Prediction Distribution ---
    const dist = {
      'Non Demented': 0,
      'Very Mild Demented': 0,
      'Mild Demented': 0,
      'Moderate Demented': 0
    };

    patients.forEach(p => {
      if (p.history && p.history.length > 0) {
        const diagnosticRecords = p.history.filter(h => h.diagnosis !== 'Initial');
        
        if (diagnosticRecords.length > 0) {
          const latest = diagnosticRecords.sort((a, b) => b.date - a.date)[0];
          
          let diag = latest.diagnosis;
          // Normalize common variations
          if (diag === 'Non-Demented') diag = 'Non Demented';
          if (diag === 'Very Mild') diag = 'Very Mild Demented';
          if (diag === 'Mild') diag = 'Mild Demented';
          if (diag === 'Moderate') diag = 'Moderate Demented';

          if (dist[diag] !== undefined) {
            dist[diag]++;
          }
        }
      }
    });

    const predictionData = [
      { name: 'Non-Demented', value: dist['Non Demented'], color: '#10b981' },
      { name: 'Very Mild', value: dist['Very Mild Demented'], color: '#3b82f6' },
      { name: 'Mild', value: dist['Mild Demented'], color: '#f59e0b' },
      { name: 'Moderate', value: dist['Moderate Demented'], color: '#ef4444' },
    ];

    // --- 3. Age & Gender Distribution ---
    const ageRanges = {
      '0-20': { male: 0, female: 0 },
      '21-40': { male: 0, female: 0 },
      '41-60': { male: 0, female: 0 },
      '61-80': { male: 0, female: 0 },
      '81+': { male: 0, female: 0 }
    };

    patients.forEach(p => {
      let range = '81+';
      const age = p.age || 0;
      if (age <= 20) range = '0-20';
      else if (age <= 40) range = '21-40';
      else if (age <= 60) range = '41-60';
      else if (age <= 80) range = '61-80';

      const gender = String(p.gender || '').toLowerCase();
      if (gender === 'female') {
        ageRanges[range].female++;
      } else if (gender === 'male') {
        ageRanges[range].male++;
      }
    });

    const ageData = Object.keys(ageRanges).map(key => ({
      range: key,
      male: ageRanges[key].male,
      female: ageRanges[key].female
    }));

    // --- 4. Recent Activities ---
    const allActivities = [];
    patients.forEach(p => {
      p.history.forEach(h => {
        allActivities.push({
          id: h._id,
          hn: p.id_card,
          patient: p.name,
          type: h.diagnosis === 'Initial' ? 'Registration' : 'AI Analysis',
          status: h.diagnosis,
          time: h.date,
          alert: h.diagnosis === 'Moderate' || h.diagnosis === 'Mild'
        });
      });
    });

    const recentActivities = allActivities
      .sort((a, b) => b.time - a.time)
      .slice(0, 10);

    // --- 5. Trend Analysis (Last 6 months) ---
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleDateString('th-TH', { month: 'short' });
      
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      
      let monthCases = 0;
      let monthRisk = 0;
      
      patients.forEach(p => {
        p.history.forEach(h => {
          if (h.date >= startOfMonth && h.date <= endOfMonth) {
            monthCases++;
            if (h.diagnosis === 'Moderate' || h.diagnosis === 'Mild') {
              monthRisk++;
            }
          }
        });
      });
      
      trendData.push({ month: monthName, cases: monthCases, risk: monthRisk });
    }

    res.json({
      kpi: {
        totalPatients,
        scansToday,
        analyzedToday,
        humanReviewedToday,
        accuracy,
        patientTrend,
        scanTrend,
        analyzedTrend,
        avgTurnaroundTime,
        accuracyTrend
      },
      predictionData,
      ageData,
      recentActivities,
      trendData
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Patient Service on port ${PORT}`);
});
