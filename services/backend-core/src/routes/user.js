// services/backend-core/src/routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware เพื่อดึงข้อมูล User จาก Token (จาก Database จริง)
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token is required' });

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    if (decoded.exp && decoded.exp < Date.now()) {
      return res.status(401).json({ error: 'Token has expired' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware สำหรับเช็คสิทธิ์ Admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin only.' });
  }
};

// --- ROUTES ---

// 1. ดึงข้อมูลโปรไฟล์ของตัวเอง
router.get('/profile', authenticateUser, (req, res) => {
  const user = req.user.toObject();
  delete user.password;
  res.json({
    message: 'Profile retrieved successfully',
    user
  });
});

// 2. ดึงรายชื่อผู้ใช้ทั้งหมด (Admin Only)
router.get('/all', authenticateUser, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 3. สร้างผู้ใช้ใหม่ (Admin Only)
router.post('/create', authenticateUser, isAdmin, async (req, res) => {
  try {
    const { username, password, name, role, email } = req.body;
    const newUser = new User({
      username: username.toLowerCase(),
      password, // In real prod: hash this
      name,
      role,
      email
    });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create user. Might be duplicate username.' });
  }
});

// 4. แก้ไขผู้ใช้ (Admin Only)
router.put('/:id', authenticateUser, isAdmin, async (req, res) => {
  try {
    const { name, role, email, password } = req.body;
    const updateData = { name, role, email };
    if (password) updateData.password = password;

    const user = await User.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Update failed' });
  }
});

// 5. ลบผู้ใช้ (Admin Only)
router.delete('/:id', authenticateUser, isAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// 6. ดึงข้อมูลผู้ใช้จากชื่อบัญชี (Public/Common lookup for tests/UI)
router.get('/account/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() }, '-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Lookup failed' });
  }
});

module.exports = router;
