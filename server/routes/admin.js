/* ══════════════════════════════════════════════
   server/routes/admin.js
   All routes require admin role.
   GET  /api/admin/users              — list all users
   GET  /api/admin/users/:id          — single user detail
   PUT  /api/admin/users/:id/role     — change user role
   DELETE /api/admin/users/:id        — delete user + all their data
   GET  /api/admin/users/:id/exercises
   GET  /api/admin/users/:id/routine
   GET  /api/admin/users/:id/metrics
   Author: Rishabh
══════════════════════════════════════════════ */
const express                       = require('express');
const router                        = express.Router();
const User                          = require('../models/User');
const Exercise                      = require('../models/Exercise');
const Routine                       = require('../models/Routine');
const HealthMetric                  = require('../models/HealthMetric');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth, requireAdmin);

/* ── List all users ── */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ── Single user detail ── */
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ── Change user role ── */
router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Role must be user or admin' });
  }
  // Prevent admin from demoting themselves
  if (req.params.id === req.user.userId) {
    return res.status(400).json({ error: 'You cannot change your own role' });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Could not update role' });
  }
});

/* ── Delete user + all their data ── */
router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.userId) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }
  try {
    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Exercise.deleteMany({ userId: req.params.id }),
      Routine.deleteMany({ userId: req.params.id }),
      HealthMetric.deleteMany({ userId: req.params.id }),
    ]);
    res.json({ message: 'User and all associated data deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete user' });
  }
});

/* ── View a user's exercises (read-only) ── */
router.get('/users/:id/exercises', async (req, res) => {
  const { month, type, search } = req.query;
  const filter = { userId: req.params.id };
  if (month) filter.date = { $regex: `^${month}` };
  if (type && ['strength','cardio'].includes(type)) filter.type = type;
  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: regex }, { notes: regex }, { category: regex }];
  }
  try {
    const exercises = await Exercise.find(filter).sort({ date: -1, createdAt: 1 });
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ── View a user's routine (read-only) ── */
router.get('/users/:id/routine', async (req, res) => {
  try {
    const routine = await Routine.findOne({ userId: req.params.id });
    res.json(routine || {});
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ── View a user's health metrics (read-only) ── */
router.get('/users/:id/metrics', async (req, res) => {
  const { from, to } = req.query;
  const filter = { userId: req.params.id };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = from;
    if (to)   filter.date.$lte = to;
  }
  try {
    const metrics = await HealthMetric.find(filter).sort({ date: 1 });
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ── Calendar summary for any user (admin) ── */
router.get('/users/:id/calendar-summary', async (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) return res.status(400).json({ error: 'year and month required' });

  const prefix = `${year}-${String(month).padStart(2,'0')}`;
  try {
    const exercises = await Exercise
      .find({ userId: req.params.id, date: { $regex: `^${prefix}` } })
      .select('date name category type -_id')
      .sort({ date: 1 });

    const grouped = {};
    exercises.forEach(ex => {
      if (!grouped[ex.date]) grouped[ex.date] = [];
      grouped[ex.date].push({ name: ex.name, category: ex.category, type: ex.type });
    });

    res.json(Object.entries(grouped).map(([date, exs]) => ({ date, exercises: exs })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
