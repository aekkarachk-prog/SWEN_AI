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

// 🛡️ Security: Trust proxy (Nginx/Cloud Run)
app.set('trust proxy', 1);

// 🛡️ Security: Secure HTTP headers with Helmet (Allow Cross-Origin for Vercel)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.disable('x-powered-by');

// 🛡️ Security: Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Rate limit exceeded. Please try again later.' }
});
app.use('/api/', limiter);

app.use(cors());
app.use(express.json({ limit: '10mb' })); 

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 8080; // Cloud Run uses 8080
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alzheimer_db';

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 🛡️ Route for serving images (Local fallback then GCS)
app.get('/uploads/:filename', async (req, res) => {
  const fileName = req.params.filename;
  const localPath = path.join(uploadsDir, fileName);

  if (fs.existsSync(localPath)) {
    return res.sendFile(localPath);
  }

  try {
    const file = bucket.file(fileName);
    const [exists] = await file.exists();
    if (exists) {
      file.createReadStream().pipe(res);
    } else {
      res.status(404).send('Not Found');
    }
  } catch (err) {
    res.status(500).send('Internal Error');
  }
});

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (Patient Service)'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

const patientSchema = new mongoose.Schema({
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
});

const Patient = mongoose.model('Patient', patientSchema);

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

app.get('/api/patients/health', (req, res) => {
  res.json({ status: "ok", service: "patient-service" });
});

app.get('/api/patients', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const { id_card, name, age, gender, general_notes } = req.body;
    if (!id_card || !name) return res.status(400).json({ error: 'Missing fields' });

    const patient = new Patient({
      id_card: String(id_card),
      name: String(name),
      age: age ? Number(age) : undefined,
      gender: gender ? String(gender) : undefined,
      general_notes: general_notes ? String(general_notes) : undefined
    });

    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ error: 'Bad Request or Duplicate ID' });
  }
});

app.post('/api/patients/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image' });

    const id_card = String(req.body.id_card);
    const diagnosis = String(req.body.diagnosis || 'AI Analysis');
    const notes = String(req.body.notes || '');
    const name = String(req.body.name || 'New Patient');
    const probability = parseFloat(req.body.probability) || 0;
    const duration = parseFloat(req.body.duration) || 0;

    const imageUrl = await uploadToGCS(req.file);
    
    const existingPatient = await Patient.findOne({ id_card: id_card });
    const updateData = {
      $push: { history: { diagnosis, probability, notes, image_url: imageUrl, date: new Date(), duration } }
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
    res.status(500).json({ 
      error: 'Internal Server Error during upload', 
      details: error.message,
      bucket: process.env.GCS_BUCKET_NAME || 'alzheimer-patient-images'
    });
  }
});

app.get('/api/patients/:id_card', async (req, res) => {
  try {
    const patient = await Patient.findOne({ id_card: String(req.params.id_card) });
    if (!patient) return res.status(404).json({ error: 'Not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/patients/:id_card', async (req, res) => {
  try {
    const updateData = {};
    if (req.body.name) updateData.name = String(req.body.name);
    if (req.body.age) updateData.age = Number(req.body.age);
    if (req.body.gender) updateData.gender = String(req.body.gender);
    if (req.body.general_notes) updateData.general_notes = String(req.body.general_notes);

    const patient = await Patient.findOneAndUpdate(
      { id_card: String(req.params.id_card) },
      { $set: updateData },
      { new: true }
    );
    res.json(patient);
  } catch (error) {
    res.status(400).json({ error: 'Bad Request' });
  }
});

app.delete('/api/patients/:id_card', async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ id_card: String(req.params.id_card) });
    if (!patient) return res.status(404).json({ error: 'Not found' });

    if (patient.history) {
      for (const h of patient.history) {
        if (h.image_url) {
          const fileName = path.basename(h.image_url);
          const localPath = path.join(uploadsDir, fileName);
          if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
          await deleteFromGCS(h.image_url);
        }
      }
    }
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/patients/:id_card/clear-history', async (req, res) => {
  try {
    const patient = await Patient.findOne({ id_card: String(req.params.id_card) });
    if (!patient) return res.status(404).json({ error: 'Not found' });

    const initialRecords = patient.history.filter(h => h.diagnosis === "Initial");
    const toDelete = patient.history.filter(h => h.diagnosis !== "Initial");

    for (const h of toDelete) {
      if (h.image_url) {
        const fileName = path.basename(h.image_url);
        const localPath = path.join(uploadsDir, fileName);
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        await deleteFromGCS(h.image_url);
      }
    }

    patient.history = initialRecords;
    await patient.save();
    res.json({ message: 'Cleared', patient });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/patients/analytics/summary', async (req, res) => {
  try {
    const patients = await Patient.find();
    // Simplified analytics for speed, add more logic as needed
    res.json({ kpi: { totalPatients: patients.length }, recentActivities: [] });
  } catch (error) {
    res.status(500).json({ error: 'Internal Error' });
  }
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Patient Service on port ${PORT}`);
});
