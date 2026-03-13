// ไฟล์: services/backend-core/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const axios = require('axios');

if (process.env.NODE_ENV !== 'test') {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alzheimer_db';
  mongoose.connect(MONGODB_URI).catch(err => console.error('❌ MongoDB Connection Error:', err));
}

const diagnosisRoutes = require('./src/routes/diagnosis');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.disable('x-powered-by');
app.use(cors({ origin: "*" }));

// 🏥 Robust Streaming Proxy (Fixed error handling)
const handlePatientProxy = async (req, res) => {
  const PATIENT_SERVICE_URL = (process.env.PATIENT_SERVICE_URL || '').replace(/\/$/, '');
  if (!PATIENT_SERVICE_URL) return res.status(502).json({ error: "PATIENT_SERVICE_URL not set" });

  let targetPath = req.originalUrl;
  // Fix: Ensure we don't double /api but keep it for patient service
  if (targetPath.includes('/patients') && !targetPath.startsWith('/api')) {
    targetPath = '/api' + targetPath;
  }

  try {
    const response = await axios({
      method: req.method,
      url: `${PATIENT_SERVICE_URL}${targetPath}`,
      data: req, 
      headers: { ...req.headers, host: new URL(PATIENT_SERVICE_URL).host },
      params: req.query,
      responseType: 'stream',
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000
    });

    if (response.headers['content-type']) res.setHeader('Content-Type', response.headers['content-type']);
    res.status(response.status);
    response.data.pipe(res);
  } catch (error) {
    if (error.response) {
      // For stream errors, we need to handle them carefully
      res.status(error.response.status).json({ error: "Service Error", details: "Upstream service returned an error" });
    } else {
      res.status(502).json({ error: "Bad Gateway", details: error.message });
    }
  }
};

app.all(['/api/patients*', '/patients*', '/uploads*'], handlePatientProxy);

app.use(express.json({ limit: '10mb' }));
app.use(['/api/diagnosis', '/diagnosis'], diagnosisRoutes);
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/user', '/user'], userRoutes);

app.get('/', (req, res) => res.json({ message: "Backend Core API is running!" }));

const PORT = process.env.PORT || 8080;
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => console.log(`Backend Core online on port ${PORT}`));
}

module.exports = app;
