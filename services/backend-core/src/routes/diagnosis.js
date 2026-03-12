const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const router = express.Router();

// ตั้งค่า Multer สำหรับรับไฟล์ไว้ใน Memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 🛡️ Security: Limit file size to 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/png", "image/jpeg"];
    const allowedExtensions = [".png", ".jpg", ".jpeg"];
  
    const ext = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf("."));
  
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type (MIME)"));
    }
  
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error("Invalid file extension"));
    }
  
    cb(null, true);
  }
});

// รับ POST Request ที่ /api/diagnosis
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image file' });
    }

    // สร้าง FormData เพื่อเตรียมส่งต่อไปยัง ai-service
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname.replace(/[^a-zA-Z0-9.]/g, ''), // 🛡️ Security: Sanitize filename
      contentType: req.file.mimetype,
    });

    // AI_SERVICE_URL จาก environment 
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai-service:8080/predict';

    console.log(`Forwarding image to AI Service`); // Obscured full URL in generic logs
    
    const aiResponse = await axios.post(aiServiceUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    res.json(aiResponse.data);
    console.log("AI Prediction successful:", aiResponse.data.prediction);

  } catch (error) {
    console.error('Error in diagnosis route:', error.message);
    
    // 🛡️ Security: Mask internal error stack traces
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'AI Service Error',
        details: 'The AI Service encountered an error processing the request.'
      });
    }

    res.status(500).json({ 
      error: 'Failed to process diagnosis',
      details: 'Internal Server Error' 
    });
  }
});

module.exports = router;
