/* ══════════════════════════════════════════════
   server/routes/gymClosures.js
   GET    /api/gym-closures?year=&month=   (all users)
   POST   /api/gym-closures               (admin only)
   PUT    /api/gym-closures/:id           (admin only)
   DELETE /api/gym-closures/:id           (admin only)
   Author: Rishabh
══════════════════════════════════════════════ */
const express                   = require('express');
const router                    = express.Router();
const GymClosure                = require('../models/GymClosure');
const { requireAuth, requireAdmin } = require('../middleware/auth');

/* ── READ — all users can see closures ── */
router.get('/', requireAuth, async (req, res) => {
  const { year, month } = req.query;
  const filter = {};

  if (year && month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    filter.date = { $regex: `^${prefix}` };
  }

  try {
    const closures = await GymClosure
      .find(filter)
      .populate('createdBy', 'name')
      .sort({ date: 1 });
    res.json(closures);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ── CREATE — admin only ── */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { date, title, reason, endDate } = req.body;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Valid date (YYYY-MM-DD) is required' });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Reason is required' });
  }

  try {
    const closure = await GymClosure.create({
      createdBy: req.user.userId,
      date,
      title:   title?.trim()   || 'Gym Closed',
      reason:  reason.trim(),
      endDate: endDate || null,
    });
    res.status(201).json(closure);
  } catch (err) {
    res.status(500).json({ error: 'Could not create closure notice' });
  }
});

/* ── UPDATE — admin only ── */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { date, title, reason, endDate } = req.body;
  const update = {};
  if (date)   update.date   = date;
  if (title)  update.title  = title.trim();
  if (reason) update.reason = reason.trim();
  if (endDate !== undefined) update.endDate = endDate || null;

  try {
    const closure = await GymClosure.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!closure) return res.status(404).json({ error: 'Closure not found' });
    res.json(closure);
  } catch (err) {
    res.status(500).json({ error: 'Could not update closure' });
  }
});

/* ── DELETE — admin only ── */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await GymClosure.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Closure not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Could not delete closure' });
  }
});

module.exports = router;
