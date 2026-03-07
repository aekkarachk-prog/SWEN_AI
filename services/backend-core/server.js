// ไฟล์: services/backend-core/server.js
const express = require('express');
const cors = require('cors');

// ดึง Route ที่เพื่อนเขียนไว้มาใช้งาน
const diagnosisRoutes = require('./src/routes/diagnosis');

const app = express();
app.use(cors({
  origin: "*"
})); // อนุญาตให้ทุกโดเมนเข้าถึง API ได้ (สำหรับการพัฒนา)
app.use(express.json()); // บรรทัดนี้สำคัญมาก! ทำให้รับข้อมูล Login เป็น JSON ได้

// เชื่อม Route เข้ากับ Path ของระบบ
app.use('/api/diagnosis', diagnosisRoutes);

// หน้าแรกเอาไว้เช็ค Health
app.get('/', (req, res) => {
  res.json({ message: "Backend Core is running!" });
});

// ---------------------------------------------------------
// 🔐 ระบบ Login (พนักงานเฝ้าประตู)
// ---------------------------------------------------------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Test Case 3: เช็คว่ากรอกข้อมูลมาครบไหม
  if (!username || !password) {
    return res.status(400).json({ error: 'Please provide username and password' });
  }

  // Test Case 1 & 2: ตรวจสอบ Username และ Password
  // (เวอร์ชันนี้จำลองการเช็ค Hardcode ไปก่อน อนาคตค่อยต่อ Database)
  if (username === 'doctor_somchai' && password === 'password123') {
    // กรณีสำเร็จ 
    return res.status(200).json({ 
      message: 'Login successful', 
      token: 'mock_jwt_token_mhs9lh' // ส่ง Token จำลองกลับไปให้หน้าเว็บ
    });
  } else {
    // กรณีรหัสผิด หรือไม่มีชื่อผู้ใช้
    return res.status(401).json({ error: 'Invalid username or password' });
  }
});
// ---------------------------------------------------------

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