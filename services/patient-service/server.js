const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Request Logger สำหรับดีบั๊ก (จะช่วยให้เห็นว่า Path ไหนส่งมาถึงบ้าง)
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

app.use('/uploads', express.static(uploadsDir));

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (Patient Service)'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

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

// --- API Routes (ใช้ Full Path ตรงๆ เพื่อลดความสับสนเรื่อง Prefix) ---

app.get('/api/patients/health', (req, res) => {
  res.json({ status: "ok", service: "patient-service" });
});

// 1. Get all
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Create
app.post('/api/patients', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Upload (วางไว้ก่อน :id_card)
app.post('/api/patients/upload', upload.single('image'), async (req, res) => {
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
app.get('/api/patients/:id_card', async (req, res) => {
  try {
    const patient = await Patient.findOne({ id_card: req.params.id_card });
    if (!patient) return res.status(404).json({ error: 'Not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Delete
app.delete('/api/patients/:id_card', async (req, res) => {
  try {
    console.log(`Attempting to delete patient: ${req.params.id_card}`);
    const patient = await Patient.findOneAndDelete({ id_card: req.params.id_card });
    
    if (!patient) {
      console.log(`Patient ${req.params.id_card} not found in DB`);
      return res.status(404).json({ error: 'Not found' });
    }

    if (patient.history) {
      patient.history.forEach(h => {
        if (h.image_url) {
          const fileName = path.basename(h.image_url);
          const filePath = path.join(uploadsDir, fileName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${filePath}`);
          }
        }
      });
    }
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Patient Service on port ${PORT}`);
});
