// ไฟล์: services/backend-core/server.js
const express = require('express');
const cors = require('cors');

const diagnosisRoutes = require('./src/routes/diagnosis');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');

const app = express();

// 🛡️ Security: Hide Express stack info
app.disable('x-powered-by');

app.use(cors({ origin: "*" })); 

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
  console.error('Unhandled Server Error:', err); // Log internally
  
  // Handling standard errors safely without exposing internal paths/stack
  if (err instanceof require('multer').MulterError || err.message.includes('Invalid file')) {
    return res.status(400).json({ error: 'File validation failed or size exceeded limit.' });
  }

  // Generic response to avoid Information Disclosure
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 8080;

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
