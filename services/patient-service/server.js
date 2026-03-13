const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const { Storage } = require('@google-cloud/storage');

const app = express();

// 🌩️ Google Cloud Storage Setup
const BUCKET_NAME = process.env.GCS_BUCKET_NAME;
const storageGCS = new Storage();

// 🛡️ Helper for GCS Upload (Mandatory)
const uploadToGCS = (file) => new Promise((resolve, reject) => {
  if (!BUCKET_NAME) return reject(new Error("GCS_BUCKET_NAME environment variable is missing"));
  if (!file) return resolve(null);
  
  const bucket = storageGCS.bucket(BUCKET_NAME);
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const blobName = uniqueSuffix + path.extname(file.originalname);
  const blob = bucket.file(blobName);
  
  const blobStream = blob.createWriteStream({
    resumable: false,
    gzip: true,
    metadata: { contentType: file.mimetype }
  });

  blobStream.on('error', (err) => reject(err));
  blobStream.on('finish', () => resolve(`/uploads/${blobName}`));
  blobStream.end(file.buffer);
});

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/patients/health', (req, res) => {
  res.json({ status: "ok", bucket: BUCKET_NAME || "NOT_CONFIGURED" });
});

// Serve Images from GCS
app.get('/uploads/:filename', async (req, res) => {
  if (!BUCKET_NAME) return res.status(500).json({ error: "GCS not configured" });
  
  const fileName = req.params.filename;
  try {
    const file = storageGCS.bucket(BUCKET_NAME).file(fileName);
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
mongoose.connect(MONGODB_URI).catch(err => console.error('❌ MongoDB Error:', err));

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

const upload = multer({ storage: multer.memoryStorage() });

// --- Routes ---

app.get('/api/patients', async (req, res) => {
  res.json(await Patient.find());
});

app.post('/api/patients', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (e) {
    res.status(400).json({ error: "Creation failed", details: e.message });
  }
});

app.post('/api/patients/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) throw new Error("No image file received");
    
    // 🚀 Force GCS Upload
    const imageUrl = await uploadToGCS(req.file);
    
    const probability = parseFloat(req.body.probability) || 0;
    const duration = parseFloat(req.body.duration) || 0;

    const updateData = {
      $push: { history: { 
        diagnosis: req.body.diagnosis || 'Initial', 
        probability, 
        notes: req.body.notes || '', 
        image_url: imageUrl, 
        duration 
      } }
    };

    const existing = await Patient.findOne({ id_card: req.body.id_card });
    if (!existing || !existing.profile_pic) updateData.$set = { profile_pic: imageUrl };
    if (!existing) updateData.$setOnInsert = { name: req.body.name, created_at: new Date() };

    const patient = await Patient.findOneAndUpdate(
      { id_card: req.body.id_card },
      updateData,
      { new: true, upsert: true }
    );

    res.json({ message: "Success", patient, imageUrl });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: 'Upload Failed', details: error.message });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  const p = await Patient.findOne({ id_card: req.params.id });
  p ? res.json(p) : res.status(404).json({ error: "Not found" });
});

app.delete('/api/patients/:id', async (req, res) => {
  await Patient.findOneAndDelete({ id_card: req.params.id });
  res.json({ message: "Deleted" });
});

app.listen(8080, '0.0.0.0', () => console.log(`Patient Service online on 8080`));
