const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// 🛡️ Security: Hide Express framework information
app.disable('x-powered-by');

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

// 🛡️ Security: Prevent directory traversal in static files
app.use('/uploads', express.static(uploadsDir, {
  dotfiles: 'ignore', // Ignore hidden files
  fallthrough: false  // Return 404 if not found
}));

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
    // 🛡️ Security: Generate random filename to prevent path traversal and overriding
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, ''); // Sanitize extension
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 🛡️ Security: Max file size 5MB
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

// 1. Get all
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    console.error("DB Error:", error);
    // 🛡️ Security: Do not leak DB error details to the client
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Create
app.post('/api/patients', async (req, res) => {
  try {
    // 🛡️ Security: Explicitly define allowed fields to prevent Mass Assignment
    const { id_card, name, age, gender, general_notes } = req.body;
    
    if (!id_card || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const patient = new Patient({
      id_card: String(id_card), // Prevent NoSQL Injection
      name: String(name),
      age: age ? Number(age) : undefined,
      gender: gender ? String(gender) : undefined,
      general_notes: general_notes ? String(general_notes) : undefined
    });

    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    console.error("Create Error:", error);
    res.status(400).json({ error: 'Bad Request or Duplicate ID' });
  }
});

// 3. Upload AI Result
app.post('/api/patients/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    // 🛡️ Security: Type casting to prevent NoSQL Injection
    const id_card = String(req.body.id_card);
    const diagnosis = String(req.body.diagnosis || 'AI Analysis');
    const notes = String(req.body.notes || '');
    const name = String(req.body.name || 'New Patient');
    const probability = parseFloat(req.body.probability) || 0;

    const imageUrl = `/uploads/${req.file.filename}`;
    
    const updateData = {
      $push: { history: { 
        diagnosis, 
        probability,
        notes, 
        image_url: imageUrl,
        date: new Date()
      } },
      $setOnInsert: { 
        name,
        created_at: new Date()
      }
    };

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
    res.status(500).json({ error: 'Internal Server Error during upload' });
  }
});

// 4. Get by ID
app.get('/api/patients/:id_card', async (req, res) => {
  try {
    // 🛡️ Security: Cast to String
    const patient = await Patient.findOne({ id_card: String(req.params.id_card) });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    console.error("Get ID Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4.5 Update Patient Info
app.put('/api/patients/:id_card', async (req, res) => {
  try {
    // 🛡️ Security: Explicitly define and cast allowed fields
    const updateData = {};
    if (req.body.name) updateData.name = String(req.body.name);
    if (req.body.age) updateData.age = Number(req.body.age);
    if (req.body.gender) updateData.gender = String(req.body.gender);
    if (req.body.general_notes) updateData.general_notes = String(req.body.general_notes);
    if (req.body.profile_pic) updateData.profile_pic = String(req.body.profile_pic);

    const patient = await Patient.findOneAndUpdate(
      { id_card: String(req.params.id_card) },
      { $set: updateData },
      { new: true }
    );
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(400).json({ error: 'Bad Request' });
  }
});

// 5. Delete
app.delete('/api/patients/:id_card', async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ id_card: String(req.params.id_card) });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (patient.history) {
      patient.history.forEach(h => {
        if (h.image_url) {
          const fileName = path.basename(h.image_url);
          const filePath = path.join(uploadsDir, fileName);
          // 🛡️ Security: Ensure file is within uploads directory
          if (filePath.startsWith(uploadsDir) && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });
    }
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Clear History (Keep Initial)
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

    recordsToDelete.forEach(h => {
      if (h.image_url) {
        const fileName = path.basename(h.image_url);
        const filePath = path.join(uploadsDir, fileName);
        if (filePath.startsWith(uploadsDir) && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
      }
    });

    patient.history = initialRecords;
    await patient.save();

    res.json({ message: 'History cleared', patient });
  } catch (error) {
    console.error("Clear History Error:", error);
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
