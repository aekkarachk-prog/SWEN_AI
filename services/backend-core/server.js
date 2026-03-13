// ไฟล์: services/backend-core/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

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

// 🛡️ Security: Trust proxy (Nginx)
app.set('trust proxy', 1);

// 🛡️ Security Header: Using helmet to set security-related headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.disable('x-powered-by');

// 🛡️ Security: CORS Protection
app.use(cors({ origin: "*" })); // In production, restrict this!

// 🛡️ Security: Rate Limiting to prevent Brute Force/DoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// 🛡️ Security: Restrict payload size to prevent DoS
app.use(express.json({ limit: '10mb' })); // Increased for potential patient data transfers

// 🏥 Proxy for Patient Service (Handles both /api/patients and /patients)
const handlePatientProxy = async (req, res) => {
  const PATIENT_SERVICE_URL = (process.env.PATIENT_SERVICE_URL || '').replace(/\/$/, '');
  
  if (!PATIENT_SERVICE_URL) {
    console.error("[Proxy Error] PATIENT_SERVICE_URL is not set");
    return res.status(502).json({ error: "Configuration Error", details: "PATIENT_SERVICE_URL is not set on server" });
  }

  // Ensure target path is correct
  let targetPath = req.originalUrl;
  
  // 1. If it's a /patients request, ensure it has /api prefix for the service
  if (targetPath.includes('/patients') && !targetPath.startsWith('/api')) {
    targetPath = '/api' + targetPath;
  }
  
  const fullUrl = `${PATIENT_SERVICE_URL}${targetPath}`;
  console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${fullUrl}`);
  
  try {
    const config = {
      method: req.method,
      url: fullUrl,
      headers: { 
        'accept': req.headers.accept,
        'authorization': req.headers.authorization,
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      },
      params: req.query,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000 // 60s for slow uploads
    };
    
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      config.data = req.body;
    }

    const response = await axios(config);
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      console.error(`[Proxy Error] Service returned ${error.response.status}:`, JSON.stringify(error.response.data));
      return res.status(error.response.status).json(error.response.data);
    }
    console.error(`[Proxy Error] Connection failed to ${fullUrl}: ${error.message}`);
    res.status(502).json({ error: "Bad Gateway", details: "Patient Service unreachable" });
  }
};

app.all(['/api/patients*', '/patients*', '/uploads*'], handlePatientProxy);

// 🛠️ Mount other routes at both prefixed and non-prefixed paths
app.use(['/api/diagnosis', '/diagnosis'], diagnosisRoutes);
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/user', '/user'], userRoutes);

app.get('/', (req, res) => {
  res.json({ message: "Backend Core API is running!" });
});

// ---------------------------------------------------------
// 🚨 Global Error Handler (Security Hardened)
// ---------------------------------------------------------
app.use((err, req, res, next) => {
  // 🛡️ Security: Always log internally for debugging, NEVER send to client
  console.error(`[${new Date().toISOString()}] Unhandled Server Error:`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  }); 
  
  // 🛡️ Handling standard errors safely without exposing internal paths/stack
  if (err instanceof require('multer').MulterError || err.message.includes('Invalid file')) {
    return res.status(400).json({ 
      error: 'File validation failed or size exceeded limit.',
      code: 'FILE_VALIDATION_ERROR'
    });
  }

  // Handle JSON parsing errors (syntax errors)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      error: 'Invalid JSON body format.',
      code: 'INVALID_JSON'
    });
  }

  // Generic response to avoid Information Disclosure (Hacker prevention)
  res.status(500).json({ 
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR'
  });
});

const PORT = process.env.PORT || 8080;

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
