const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const router = express.Router();

// ตั้งค่า Multer สำหรับรับไฟล์ไว้ใน Memory (เพื่อส่งต่อได้ทันทีโดยไม่ต้องเซฟลงดิสก์)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// รับ POST Request ที่ /api/diagnosis
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image file' });
    }

    // สร้าง FormData เพื่อเตรียมส่งต่อไปยัง ai-service
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // ส่งไฟล์ไปให้ ai-service ที่พอร์ต 5000 (ชื่อโฮสต์ 'ai-service' มาจาก Docker network)
    // ถ้าคุณรันแยกโดยไม่ใช้ Docker ให้เปลี่ยน 'ai-service' เป็น 'localhost'
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://svc-ai:5000/predict';
    
    console.log('Forwarding image to AI Service...');
    
    const aiResponse = await axios.post(aiServiceUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    // ส่งผลลัพธ์จาก AI กลับไปให้ Frontend
    res.json(aiResponse.data);

  } catch (error) {
    console.error('Error in diagnosis route:', error.message);
    res.status(500).json({ 
      error: 'Failed to process diagnosis',
      details: error.message 
    });
  }
});

module.exports = router;