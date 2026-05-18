/* ══════════════════════════════════════════════
   server/routes/auth.js
   POST /api/auth/register
   POST /api/auth/login
   GET  /api/auth/me
   PUT  /api/auth/me
   Author: Rishabh
══════════════════════════════════════════════ */
const express          = require('express');
const router           = express.Router();
const jwt              = require('jsonwebtoken');
const User             = require('../models/User');
const { requireAuth }  = require('../middleware/auth');

/* ── Generate JWT ── */
function signToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/* ────────────────────────────────────────────
   REGISTER
   POST /api/auth/register
──────────────────────────────────────────── */
router.post('/register', async (req, res) => {
  const { name, email, password, heightCm } = req.body;

  // Basic validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters.' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = new User({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password,
      heightCm: heightCm ? parseFloat(heightCm) : null,
      avatarInitials: name.trim().slice(0, 2).toUpperCase(),
    });

    await user.save();

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/* ────────────────────────────────────────────
   LOGIN
   POST /api/auth/login
──────────────────────────────────────────── */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/* ────────────────────────────────────────────
   GET CURRENT USER
   GET /api/auth/me
──────────────────────────────────────────── */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

/* ────────────────────────────────────────────
   UPDATE PROFILE
   PUT /api/auth/me
──────────────────────────────────────────── */
router.put('/me', requireAuth, async (req, res) => {
  const { name, heightCm } = req.body;
  const update = {};

  if (name && name.trim().length >= 2) {
    update.name = name.trim();
    update.avatarInitials = name.trim().slice(0, 2).toUpperCase();
  }
  if (heightCm !== undefined) {
    update.heightCm = heightCm ? parseFloat(heightCm) : null;
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: update },
      { new: true, runValidators: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;
