const express = require('express');
const cors = require('cors');
const diagnosisRoutes = require('./routes/diagnosis');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// สังเกตว่าใน Nginx ส่งมาที่ /api/ ดังนั้นเราจะรับที่นี่
app.use('/api/diagnosis', diagnosisRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend Core is running' });
});

app.listen(PORT, () => {
  console.log(`Backend Core listening on port ${PORT}`);
});