/* ══════════════════════════════════════════════
   server/models/User.js — User schema
   Author: Rishabh
══════════════════════════════════════════════ */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  // Profile fields
  heightCm: {
    type: Number,
    default: null,
    min: 50,
    max: 300,
  },
  avatarInitials: {
    type: String,
    default: null,
  },
}, { timestamps: true });

/* Hash password before saving */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/* Compare plain text password with hash */
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

/* Never return password in JSON responses */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
