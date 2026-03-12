// ไฟล์: services/backend-core/server.js
const express = require('express');
const cors = require('cors');

// ดึง Route ต่างๆ มาใช้งาน
const diagnosisRoutes = require('./src/routes/diagnosis');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');

const app = express();
app.use(cors({
  origin: "*"
})); // อนุญาตให้ทุกโดเมนเข้าถึง API ได้ (สำหรับการพัฒนา)
app.use(express.json()); // บรรทัดนี้สำคัญมาก! ทำให้รับข้อมูล Login เป็น JSON ได้

// เชื่อม Route เข้ากับ Path ของระบบ
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/auth', authRoutes); // /api/auth/login
app.use('/api/user', userRoutes); // /api/user/profile หรือ /api/user/account/:username

// หน้าแรกเอาไว้เช็ค Health
app.get('/', (req, res) => {
  res.json({ message: "Backend Core (Microservices Ready) is running!" });
});

// ---------------------------------------------------------
// 🚨 Global Error Handler
// ---------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message || err);
  
  // จัดการ Error จาก Multer (เช่น ไฟล์ใหญ่เกิน)
  if (err instanceof require('multer').MulterError || err.message.includes('Invalid file')) {
    return res.status(400).json({ error: 'File upload error', details: err.message });
  }

  res.status(500).json({ error: 'Internal Server Error', details: err.message || 'Something went wrong' });
});

// เริ่มเซิร์ฟเวอร์ที่พอร์ต 8080 หรือพอร์ตที่กำหนดใน environment variable
const PORT = process.env.PORT || 8080;

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// ต้องส่งออก app เสมอ เพื่อให้เทสต์ดึงไปใช้ได้
module.exports = app;