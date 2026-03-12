const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alzheimer_db';

// --- Ensure Uploads Directory Exists ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- Serve Static Files ---
app.use('/uploads', express.static(uploadsDir));

// --- MongoDB Connection ---
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (Patient Service)'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- Patient Model ---
const patientSchema = new mongoose.Schema({
  id_card: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: Number,
  gender: String,
  history: [{
    diagnosis: String,
    probability: Number,
    date: { type: Date, default: Date.now },
    notes: String,
    image_url: String
  }],
  created_at: { type: Date, default: Date.now }
});

const Patient = mongoose.model('Patient', patientSchema);

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Only images are allowed"));
  }
});

// --- API Router ---
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: "ok", service: "patient-service" });
});

// 1. Get all patients
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Create patient
router.post('/', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Upload image (MUST be before :id_card)
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { id_card, diagnosis, notes, name, probability } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const imageUrl = `/uploads/${req.file.filename}`;
    const patient = await Patient.findOneAndUpdate(
      { id_card: id_card },
      { 
        $set: { name: name || 'Unknown Patient' },
        $push: { history: { 
          diagnosis: diagnosis || 'General Upload', 
          probability: parseFloat(probability) || 0,
          notes: notes || '', 
          image_url: imageUrl 
        } } 
      },
      { new: true, upsert: true }
    );

    res.json({ message: "Success", patient, imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get by ID
router.get('/:id_card', async (req, res) => {
  try {
    const patient = await Patient.findOne({ id_card: req.params.id_card });
    if (!patient) return res.status(404).json({ error: 'Not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Delete
router.delete('/:id_card', async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ id_card: req.params.id_card });
    if (!patient) return res.status(404).json({ error: 'Not found' });

    if (patient.history) {
      patient.history.forEach(h => {
        if (h.image_url) {
          const filePath = path.join(uploadsDir, path.basename(h.image_url));
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      });
    }
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mount the router
app.use('/api/patients', router);

app.listen(PORT, () => {
  console.log(`Patient Service on port ${PORT}`);
});
