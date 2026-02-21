// ไฟล์: services/backend-core/server.js
const express = require('express');
const cors = require('cors');

// 1. ดึง Route ที่เพื่อนเขียนไว้มาใช้งาน
const diagnosisRoutes = require('./src/routes/diagnosis');

const app = express();

app.use(cors());
app.use(express.json());

// 2. เชื่อม Route เข้ากับ Path ของระบบ
app.use('/api/diagnosis', diagnosisRoutes);

// หน้าแรกเอาไว้เช็ค Health
app.get('/', (req, res) => {
  res.json({ message: "Backend Core is running!" });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Backend Core running on port ${PORT}`));