/* ══════════════════════════════════════════════
   server/routes/healthMetrics.js
   GET    /api/health-metrics?from=&to=
   GET    /api/health-metrics/:date
   POST   /api/health-metrics
   PUT    /api/health-metrics/:date
   DELETE /api/health-metrics/:date
   Author: Rishabh
══════════════════════════════════════════════ */
const express         = require('express');
const router          = express.Router();
const HealthMetric    = require('../models/HealthMetric');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

/* ── GET range (for graph) ── */
router.get('/', async (req, res) => {
  const { from, to, userId: queryUserId } = req.query;

  // Admins can view any user's metrics
  const targetUserId = (req.user.role === 'admin' && queryUserId)
    ? queryUserId
    : req.user.userId;

  const filter = { userId: targetUserId };
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

/* ── GET single date ── */
router.get('/:date', async (req, res) => {
  try {
    const metric = await HealthMetric.findOne({
      userId: req.user.userId,
      date:   req.params.date,
    });
    if (!metric) return res.status(404).json({ error: 'No entry for this date' });
    res.json(metric);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ── CREATE or UPDATE (upsert by date) ── */
router.post('/', async (req, res) => {
  const { date, weightKg, caloriesKcal, notes } = req.body;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Valid date (YYYY-MM-DD) is required' });
  }
  if (weightKg === undefined && caloriesKcal === undefined) {
    return res.status(400).json({ error: 'At least one of weightKg or caloriesKcal is required' });
  }

  try {
    const metric = await HealthMetric.findOneAndUpdate(
      { userId: req.user.userId, date },
      {
        $set: {
          weightKg:     weightKg     !== undefined ? parseFloat(weightKg)     : undefined,
          caloriesKcal: caloriesKcal !== undefined ? parseInt(caloriesKcal)   : undefined,
          notes:        notes?.trim() || null,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json(metric);
  } catch (err) {
    res.status(500).json({ error: 'Could not save health metric' });
  }
});

/* ── UPDATE ── */
router.put('/:date', async (req, res) => {
  const { weightKg, caloriesKcal, notes } = req.body;
  const update = {};
  if (weightKg     !== undefined) update.weightKg     = parseFloat(weightKg);
  if (caloriesKcal !== undefined) update.caloriesKcal = parseInt(caloriesKcal);
  if (notes        !== undefined) update.notes        = notes?.trim() || null;

  try {
    const metric = await HealthMetric.findOneAndUpdate(
      { userId: req.user.userId, date: req.params.date },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!metric) return res.status(404).json({ error: 'No entry for this date' });
    res.json(metric);
  } catch (err) {
    res.status(500).json({ error: 'Could not update metric' });
  }
});

/* ── DELETE ── */
router.delete('/:date', async (req, res) => {
  try {
    const deleted = await HealthMetric.findOneAndDelete({
      userId: req.user.userId,
      date:   req.params.date,
    });
    if (!deleted) return res.status(404).json({ error: 'No entry for this date' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Could not delete metric' });
  }
});

module.exports = router;
