// services/backend-core/src/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// สำหรับการจำลอง JWT (ในระบบจริงควรใช้ jsonwebtoken)
const generateMockToken = (user) => {
  return Buffer.from(JSON.stringify({ 
    id: user._id, 
    username: user.username, 
    exp: Date.now() + 3600000 
  })).toString('base64');
};

// 🛡️ Route: Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  try {
    // 🛡️ Search real database
    const user = await User.findOne({ 
      username: username.toLowerCase(), 
      password: password // SECURITY: In real production, use bcrypt.compare
    });

    if (user) {
      const token = generateMockToken(user);
      return res.status(200).json({ 
        message: 'Login successful', 
        token,
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          role: user.role
        }
      });
    } else {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 🛠️ Route: Initial Admin Setup (Run once or protected)
router.post('/setup-admin', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    if (existingAdmin) return res.status(400).json({ error: 'Admin already exists' });

    const admin = new User({
      username: 'admin',
      password: 'admin_password', // Change this immediately
      name: 'System Administrator',
      role: 'ADMIN',
      email: 'admin@mdkku.com'
    });

    await admin.save();
    res.status(201).json({ message: 'Default admin created', username: 'admin' });
  } catch (error) {
    res.status(500).json({ error: 'Setup failed' });
  }
});

module.exports = router;
