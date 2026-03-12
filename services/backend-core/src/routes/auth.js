// services/backend-core/src/routes/auth.js
const express = require('express');
const router = express.Router();
const MOCK_USERS = require('../data/users');

// สำหรับการจำลอง JWT (ในระบบจริงควรใช้ jsonwebtoken)
const generateMockToken = (user) => {
  return Buffer.from(JSON.stringify({ 
    id: user.id, 
    username: user.username, 
    exp: Date.now() + 3600000 
  })).toString('base64');
};

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 🛡️ Security: Validate input types to prevent NoSQL injection/Prototype Pollution equivalents
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  // ค้นหาผู้ใช้จาก "Database"
  const user = MOCK_USERS.find(u => u.username === username && u.password === password);

  if (user) {
    const token = generateMockToken(user);
    return res.status(200).json({ 
      message: 'Login successful', 
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } else {
    // 🛡️ Security: Use generic error messages for authentication failure
    return res.status(401).json({ error: 'Invalid username or password' });
  }
});

module.exports = router;
