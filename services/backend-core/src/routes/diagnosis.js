const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const router = express.Router();

const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type'));
    } else {
      cb(null, true);
    }
  },
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Please upload an image file (.png .jpg .jpeg only)' 
      });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://svc-ai:5000/predict';

    console.log('Forwarding image to AI Service...');

    const aiResponse = await axios.post(aiServiceUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    res.json(aiResponse.data);

  } catch (error) {
    console.error('Error in diagnosis route:', error.message);

    res.status(500).json({
      error: 'Failed to process diagnosis',
      details: error.message
    });
  }
});

// Handle Multer file type errors
router.use((err, req, res, next) => {
  if (err.message === 'Invalid file type') {
    return res.status(400).json({
      error: 'Invalid file type. Only .png .jpg .jpeg allowed'
    });
  }
  next(err);
});

module.exports = router;