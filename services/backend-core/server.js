// ไฟล์: services/backend-core/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// --- MongoDB Connection ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alzheimer_db';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (Backend Core)'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

const diagnosisRoutes = require('./src/routes/diagnosis');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');

const app = express();

// 🛡️ Security: Trust proxy (Nginx)
app.set('trust proxy', 1);

// 🛡️ Security Header: Using helmet to set security-related headers
app.use(helmet());
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
app.use(express.json({ limit: '1mb' })); 

app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

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
