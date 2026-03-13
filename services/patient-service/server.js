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

// Verify Bucket on Startup
bucket.exists().then(([exists]) => {
  if (exists) {
    console.log(`✅ GCS Bucket "${BUCKET_NAME}" is reachable.`);
  } else {
    console.error(`❌ GCS Bucket "${BUCKET_NAME}" does not exist! Please create it.`);
  }
}).catch(err => {
  console.error(`❌ GCS Connection Error: ${err.message}`);
});

// 🛡️ Helper for GCS Upload
const uploadToGCS = (file) => new Promise((resolve, reject) => {
  if (!file) {
    console.log("[GCS] No file to upload");
    return resolve(null);
  }
  
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const blobName = uniqueSuffix + path.extname(file.originalname);
  const blob = bucket.file(blobName);
  
  const blobStream = blob.createWriteStream({
    resumable: false,
    gzip: true,
    metadata: { contentType: file.mimetype }
  });

  blobStream.on('error', (err) => {
    console.error(`[GCS Upload Error] ${err.message}`);
    reject(err);
  });

  blobStream.on('finish', () => {
    console.log(`[GCS] Uploaded successfully: ${blobName}`);
    resolve(`/uploads/${blobName}`);
  });

  blobStream.end(file.buffer);
});

const deleteFromGCS = async (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
  try {
    const fileName = path.basename(imageUrl);
    await bucket.file(fileName).delete();
    console.log(`[GCS] Deleted ${fileName}`);
  } catch (err) {
    console.error(`[GCS Delete Error] ${err.message}`);
  }
};

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/patients/health', (req, res) => {
  res.json({ status: "ok", bucket: BUCKET_NAME });
});

// Serve Images (Fallback to GCS)
app.get('/uploads/:filename', async (req, res) => {
  const fileName = req.params.filename;
  try {
    const file = bucket.file(fileName);
    const [exists] = await file.exists();
    if (exists) {
      file.createReadStream().pipe(res);
    } else {
      res.status(404).json({ error: "File not found in GCS" });
    }
  } catch (err) {
    res.status(500).json({ error: "GCS Retrieval Error", details: err.message });
  }
});

// Database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alzheimer_db';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Error:', err));

const Patient = mongoose.model('Patient', new mongoose.Schema({
  id_card: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: Number,
  gender: String,
  profile_pic: String,
  general_notes: String,
  history: [{
    diagnosis: String,
    probability: Number,
    date: { type: Date, default: Date.now },
    notes: String,
    image_url: String,
    duration: Number
  }],
  created_at: { type: Date, default: Date.now }
}));

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// --- Routes ---

app.get('/api/patients', async (req, res) => {
  const patients = await Patient.find();
  res.json(patients);
});

app.get('/api/patients/:id', async (req, res) => {
  const p = await Patient.findOne({ id_card: req.params.id });
  p ? res.json(p) : res.status(404).json({ error: "Not found" });
});

app.post('/api/patients/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) throw new Error("No image file provided in request");

    console.log(`[Upload] Processing for ID: ${req.body.id_card}`);
    const imageUrl = await uploadToGCS(req.file);
    
    const existingPatient = await Patient.findOne({ id_card: req.body.id_card });
    const updateData = {
      $push: { history: { 
        diagnosis: req.body.diagnosis, 
        probability: parseFloat(req.body.probability), 
        notes: req.body.notes, 
        image_url: imageUrl, 
        duration: parseFloat(req.body.duration) 
      } }
    };

    if (!existingPatient || !existingPatient.profile_pic) updateData.$set = { profile_pic: imageUrl };
    if (!existingPatient) updateData.$setOnInsert = { name: req.body.name, created_at: new Date() };

    const patient = await Patient.findOneAndUpdate(
      { id_card: req.body.id_card },
      updateData,
      { new: true, upsert: true }
    );

    res.json({ message: "Success", patient, imageUrl });
  } catch (error) {
    console.error("Critical Upload Error:", error);
    res.status(500).json({ 
      error: 'Upload Failed', 
      details: error.message,
      step: 'GCS_OR_DB_OP'
    });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  const patient = await Patient.findOneAndDelete({ id_card: req.params.id });
  if (patient?.history) {
    for (const h of patient.history) await deleteFromGCS(h.image_url);
  }
  res.json({ message: "Deleted" });
});

// Generic Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Patient Service online on port ${PORT}`);
});
