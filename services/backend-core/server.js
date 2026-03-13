// ไฟล์: services/backend-core/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

// --- MongoDB Connection ---
if (process.env.NODE_ENV !== 'test') {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alzheimer_db';
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB (Backend Core)'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
}

const diagnosisRoutes = require('./src/routes/diagnosis');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.disable('x-powered-by');
app.use(cors({ origin: "*" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);
app.use(express.json({ limit: '10mb' }));

// 🏥 SPECIFIC PROXY FOR UPLOADS (Fixes "Unexpected end of form")
app.post(['/api/patients/upload', '/patients/upload'], upload.single('image'), async (req, res) => {
  const PATIENT_SERVICE_URL = (process.env.PATIENT_SERVICE_URL || '').replace(/\/$/, '');
  
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    const formData = new FormData();
    formData.append('image', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
    
    // Add other fields from req.body
    Object.keys(req.body).forEach(key => {
      formData.append(key, req.body[key]);
    });

    const response = await axios.post(`${PATIENT_SERVICE_URL}/api/patients/upload`, formData, {
      headers: { ...formData.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("[Proxy Upload Error]:", error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Upload failed at gateway" });
  }
});

// 🏥 GENERIC PROXY FOR OTHER PATIENT DATA
const handlePatientProxy = async (req, res) => {
  const PATIENT_SERVICE_URL = (process.env.PATIENT_SERVICE_URL || '').replace(/\/$/, '');
  let targetPath = req.originalUrl;
  if (targetPath.includes('/patients') && !targetPath.startsWith('/api')) {
    targetPath = '/api' + targetPath;
  }
  
  try {
    const config = {
      method: req.method,
      url: `${PATIENT_SERVICE_URL}${targetPath}`,
      headers: { 'accept': req.headers.accept, 'authorization': req.headers.authorization, 'content-type': req.headers['content-type'] },
      params: req.query
    };
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) config.data = req.body;

    const response = await axios(config);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 502).json(error.response?.data || { error: "Service unreachable" });
  }
};

app.all(['/api/patients*', '/patients*', '/uploads*'], handlePatientProxy);

app.use(['/api/diagnosis', '/diagnosis'], diagnosisRoutes);
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/user', '/user'], userRoutes);

app.get('/', (req, res) => res.json({ message: "Backend Core API is running!" }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`Server is running on port ${PORT}`));

module.exports = app;
