/* ══════════════════════════════════════════════
   server/routes/exercises.js
   All routes are protected by requireAuth.
   All queries are scoped to req.user.userId.
   Author: Rishabh
══════════════════════════════════════════════ */
const express         = require('express');
const router          = express.Router();
const Exercise        = require('../models/Exercise');
const { requireAuth } = require('../middleware/auth');

// All exercise routes require authentication
router.use(requireAuth);

/* ── Validation helper ── */
function validateExercise(body, res) {
  const { name, category, type } = body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'name is required' }); return false;
  }
  if (!category) {
    res.status(400).json({ error: 'category is required' }); return false;
  }
  if (!['strength', 'cardio'].includes(type)) {
    res.status(400).json({ error: 'type must be strength or cardio' }); return false;
  }
  return true;
}

/* ────────────────────────────────────────────
   GET exercises for a specific date
   GET /api/exercises?date=YYYY-MM-DD
──────────────────────────────────────────── */
router.get('/', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date query param required' });

  try {
    const exercises = await Exercise
      .find({ userId: req.user.userId, date })
      .sort({ createdAt: 1 });
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ────────────────────────────────────────────
   GET all exercises with filters + live search
   GET /api/exercises/all?type=&month=&search=
──────────────────────────────────────────── */
router.get('/all', async (req, res) => {
  const { type, month, search } = req.query;
  const filter = { userId: req.user.userId };

  if (type && ['strength', 'cardio'].includes(type)) {
    filter.type = type;
  }
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    filter.date = { $regex: `^${month}` };
  }
  // Live search — case-insensitive match on name OR notes
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: regex }, { notes: regex }, { category: regex }];
  }

  try {
    const exercises = await Exercise
      .find(filter)
      .sort({ date: -1, createdAt: 1 });
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ────────────────────────────────────────────
   Calendar summary for a month
   GET /api/exercises/summary?year=&month=
──────────────────────────────────────────── */
router.get('/summary', async (req, res) => {
  const { year, month, userId: queryUserId } = req.query;
  if (!year || !month) {
    return res.status(400).json({ error: 'year and month required' });
  }

  // Admins can query any user's summary by passing ?userId=
  const targetUserId = (req.user.role === 'admin' && queryUserId)
    ? queryUserId
    : req.user.userId;

  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  try {
    const exercises = await Exercise
      .find({ userId: targetUserId, date: { $regex: `^${prefix}` } })
      .select('date name category type -_id')
      .sort({ date: 1, createdAt: 1 });

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

/* ────────────────────────────────────────────
   CREATE exercise
   POST /api/exercises
──────────────────────────────────────────── */
router.post('/', async (req, res) => {
  if (!validateExercise(req.body, res)) return;

  const {
    date, name, category, type,
    weight, sets, reps,
    duration, durationUnit,
    notes, isProgressive, scheduleWeek,
  } = req.body;

  const doc = new Exercise({
    userId: req.user.userId,
    date, name: name.trim(), category, type,
    notes: notes?.trim() || null,
    isProgressive: !!isProgressive,
    scheduleWeek:  scheduleWeek || null,
  });

  if (type === 'strength') {
    doc.weight = parseFloat(weight) || 0;
    doc.sets   = parseInt(sets)   || null;
    doc.reps   = parseInt(reps)   || null;
  } else {
    doc.duration     = parseFloat(duration) || null;
    doc.durationUnit = durationUnit || 'minutes';
  }

  try {
    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Could not save exercise' });
  }
});

/* ────────────────────────────────────────────
   UPDATE exercise
   PUT /api/exercises/:id
──────────────────────────────────────────── */
router.put('/:id', async (req, res) => {
  if (!validateExercise(req.body, res)) return;

  const { name, category, type, weight, sets, reps, duration, durationUnit, notes } = req.body;
  const update = { name: name.trim(), category, type, notes: notes?.trim() || null };

  if (type === 'strength') {
    update.weight = parseFloat(weight) || 0;
    update.sets   = parseInt(sets)   || null;
    update.reps   = parseInt(reps)   || null;
    update.duration = null; update.durationUnit = 'minutes';
  } else {
    update.duration     = parseFloat(duration) || null;
    update.durationUnit = durationUnit || 'minutes';
    update.weight = null; update.sets = null; update.reps = null;
  }

  try {
    // Scope update to owner — prevents users editing others' exercises
    const updated = await Exercise.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Exercise not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Could not update exercise' });
  }
});

/* ────────────────────────────────────────────
   DELETE all exercises (clear calendar)
   DELETE /api/exercises/all?weekday=
──────────────────────────────────────────── */
router.delete('/all', async (req, res) => {
  const { weekday } = req.query;
  const dowMap = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 };

  try {
    let deletedCount = 0;
    if (weekday && dowMap[weekday] !== undefined) {
      const all = await Exercise.find({ userId: req.user.userId }).select('date _id');
      const toDelete = all
        .filter(ex => new Date(ex.date + 'T00:00:00').getDay() === dowMap[weekday])
        .map(ex => ex._id);
      if (toDelete.length > 0) {
        const r = await Exercise.deleteMany({ _id: { $in: toDelete } });
        deletedCount = r.deletedCount;
      }
    } else {
      const r = await Exercise.deleteMany({ userId: req.user.userId });
      deletedCount = r.deletedCount;
    }
    res.json({ deleted: deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear exercises' });
  }
});

/* ────────────────────────────────────────────
   DELETE single exercise
   DELETE /api/exercises/:id
──────────────────────────────────────────── */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Exercise.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!deleted) return res.status(404).json({ error: 'Exercise not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Could not delete exercise' });
  }
});

module.exports = router;
