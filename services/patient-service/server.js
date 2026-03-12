const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // 🟢 เพิ่ม Limit เพื่อรองรับการส่งรูป Base64 ตอน Edit

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

app.use('/uploads', express.static(uploadsDir));

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (Patient Service)'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

const patientSchema = new mongoose.Schema({
  id_card: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: Number,
  gender: String,
  profile_pic: String, // 👤 Slot สำหรับรูปโปรไฟล์คนไข้
  general_notes: String, // 📝 บันทึกเพิ่มเติมจากหมอ
  history: [{
    diagnosis: String,
    probability: Number,
    date: { type: Date, default: Date.now },
    notes: String,
    image_url: String // 🧠 Slot สำหรับรูปสแกน AI (แยกจากรูปโปรไฟล์)
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

// --- API Routes ---

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

// 2. Create (ลงทะเบียนใหม่จากหน้า History)
app.post('/api/patients', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Upload AI Result (บันทึกผลวินิจฉัย)
app.post('/api/patients/upload', upload.single('image'), async (req, res) => {
  try {
    const { id_card, diagnosis, notes, name, probability } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const imageUrl = `/uploads/${req.file.filename}`;
    
    const updateData = {
      $push: { history: { 
        diagnosis: diagnosis || 'AI Analysis', 
        probability: parseFloat(probability) || 0,
        notes: notes || '', 
        image_url: imageUrl,
        date: new Date()
      } },
      $setOnInsert: { 
        name: name || 'New Patient',
        created_at: new Date()
      }
    };

    // 👤 ถ้าคนไข้ยังไม่มีรูปโปรไฟล์ ให้ใช้รูปที่อัปโหลดล่าสุดนี้เป็นรูปโปรไฟล์เลย
    const existingPatient = await Patient.findOne({ id_card: id_card });
    if (!existingPatient || !existingPatient.profile_pic) {
      if (updateData.$setOnInsert) {
        updateData.$setOnInsert.profile_pic = imageUrl;
      } else {
        updateData.$set = { profile_pic: imageUrl };
      }
    }

    const patient = await Patient.findOneAndUpdate(
      { id_card: id_card },
      updateData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "Success", patient, imageUrl });
  } catch (error) {
    console.error("Upload AI error:", error);
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

// 4.5 Update Patient Info (Edit)
app.put('/api/patients/:id_card', async (req, res) => {
  try {
    const { name, age, gender, general_notes, profile_pic } = req.body;
    const updateData = { name, age, gender, general_notes };
    
    if (profile_pic) updateData.profile_pic = profile_pic;

    const patient = await Patient.findOneAndUpdate(
      { id_card: req.params.id_card },
      { $set: updateData },
      { new: true }
    );
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 5. Delete
app.delete('/api/patients/:id_card', async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ id_card: req.params.id_card });
    if (!patient) return res.status(404).json({ error: 'Not found' });

    if (patient.history) {
      patient.history.forEach(h => {
        if (h.image_url) {
          const fileName = path.basename(h.image_url);
          const filePath = path.join(uploadsDir, fileName);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      });
    }
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Patient Service on port ${PORT}`);
});
