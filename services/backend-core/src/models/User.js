const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // In production, this MUST be hashed
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['ADMIN', 'DOCTOR', 'NURSE'], 
    default: 'NURSE' 
  },
  email: String,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
