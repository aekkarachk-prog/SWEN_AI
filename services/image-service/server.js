// ทดสอบสร้าง Docker ไม่ใช้ของจริง code ไว้เปลี่ยนแปลงเมื่อพร้อมใช้งาน


const express = require('express');
const cors = require('cors');
// const mongoose = require('mongoose'); // เปิดใช้เมื่อพร้อมต่อ DB

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'Unknown Service';

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route (Health Check)
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    service: SERVICE_NAME,
    timestamp: new Date()
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 ${SERVICE_NAME} is running on port ${PORT}`);
});