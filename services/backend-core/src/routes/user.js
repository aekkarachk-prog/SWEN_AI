// services/backend-core/src/routes/user.js
const express = require('express');
const router = express.Router();
const MOCK_USERS = require('../data/users');

// Middleware เพื่อดึงข้อมูล User จาก Token
const authenticateMockToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token is required' });

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // เช็คว่าหมดอายุหรือยัง (ถ้า Token มี exp)
    if (decoded.exp && decoded.exp < Date.now()) {
      return res.status(401).json({ error: 'Token has expired' });
    }

    const user = MOCK_USERS.find(u => u.id === decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// 1. ดึงข้อมูลโปรไฟล์ของตัวเองโดยใช้ Token
router.get('/profile', authenticateMockToken, (req, res) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json({
    message: 'Profile retrieved successfully',
    user: userWithoutPassword
  });
});

// 2. ดึงข้อมูลผู้ใช้โดยใช้ชื่อบัญชี (Username)
// (เหมาะสำหรับการเรียกใช้ระหว่าง Microservices โดยระบุชื่อบัญชีตรงๆ)
router.get('/account/:username', (req, res) => {
  const { username } = req.params;
  const user = MOCK_USERS.find(u => u.username === username);

  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.json({
      message: `User data for ${username} found`,
      user: userWithoutPassword
    });
  } else {
    res.status(404).json({ error: `User with account ${username} not found` });
  }
});

module.exports = router;
