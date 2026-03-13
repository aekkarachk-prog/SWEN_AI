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

// 🏥 ROBUST STREAMING PROXY (Fixes binary corruption)
const handlePatientProxy = async (req, res) => {
  const PATIENT_SERVICE_URL = (process.env.PATIENT_SERVICE_URL || '').replace(/\/$/, '');
  if (!PATIENT_SERVICE_URL) return res.status(502).json({ error: "PATIENT_SERVICE_URL not set" });

  let targetPath = req.originalUrl;
  if (targetPath.includes('/patients') && !targetPath.startsWith('/api')) {
    targetPath = '/api' + targetPath;
  }

  const fullUrl = `${PATIENT_SERVICE_URL}${targetPath}`;
  console.log(`[Gateway Proxy] ${req.method} ${req.originalUrl} -> ${fullUrl}`);

  try {
    const response = await axios({
      method: req.method,
      url: fullUrl,
      data: req, // 🚀 Pipe the RAW request stream directly
      headers: { 
        ...req.headers,
        host: new URL(PATIENT_SERVICE_URL).host 
      },
      params: req.query,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      responseType: 'stream',
      timeout: 60000
    });

    res.status(response.status);
    // 🚀 Pipe the RAW response stream back to client
    response.data.pipe(res);
  } catch (error) {
    if (error.response) {
      console.error(`[Proxy Error] Service returned ${error.response.status}`);
      // For streams, we might need to consume the error body if available
      res.status(error.response.status).json({ error: "Service Error" });
    } else {
      console.error(`[Proxy Error] Connection failed: ${error.message}`);
      res.status(502).json({ error: "Bad Gateway", details: "Patient Service unreachable" });
    }
  }
};

// 🛡️ Route proxying BEFORE any body parsers to avoid stream consumption/corruption
app.all(['/api/patients*', '/patients*', '/uploads*'], handlePatientProxy);

// 🛠️ Standard Middleware ONLY for local routes
app.use(express.json({ limit: '10mb' }));

app.use(['/api/diagnosis', '/diagnosis'], diagnosisRoutes);
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/user', '/user'], userRoutes);

app.get('/', (req, res) => res.json({ message: "Backend Core API is running!" }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`Backend Core online on port ${PORT}`));

module.exports = app;
