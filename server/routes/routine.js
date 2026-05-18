/* ══════════════════════════════════════════════
   server/routes/routine.js
   GET    /api/routine
   PUT    /api/routine
   POST   /api/routine/fill-schedule
   DELETE /api/routine/clear-day/:weekday
   Author: Rishabh
══════════════════════════════════════════════ */
const express         = require('express');
const router          = express.Router();
const Routine         = require('../models/Routine');
const Exercise        = require('../models/Exercise');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

const WEEK_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DOW_MAP   = { 0:'sunday',1:'monday',2:'tuesday',3:'wednesday',4:'thursday',5:'friday',6:'saturday' };

/* ── GET routine ── */
router.get('/', async (req, res) => {
  try {
    let routine = await Routine.findOne({ userId: req.user.userId });
    if (!routine) routine = await Routine.create({ userId: req.user.userId });
    res.json(routine);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ── SAVE routine ── */
router.put('/', async (req, res) => {
  const update = {};
  WEEK_DAYS.forEach(day => {
    if (Array.isArray(req.body[day])) {
      update[day] = req.body[day].map(ex => ({
        name:         String(ex.name || '').trim(),
        category:     ex.category || 'Full Body',
        type:         ['strength','cardio'].includes(ex.type) ? ex.type : 'strength',
        weight:       parseFloat(ex.weight) || 0,
        sets:         parseInt(ex.sets)     || null,
        reps:         parseInt(ex.reps)     || null,
        duration:     parseFloat(ex.duration) || null,
        durationUnit: ex.durationUnit || 'minutes',
        notes:        ex.notes || null,
      })).filter(ex => ex.name.length > 0);
    }
  });

  try {
    let routine = await Routine.findOne({ userId: req.user.userId });
    if (!routine) {
      routine = await Routine.create({ userId: req.user.userId, ...update });
    } else {
      Object.assign(routine, update);
      await routine.save();
    }
    res.json(routine);
  } catch (err) {
    res.status(500).json({ error: 'Could not save routine' });
  }
});

/* ── FILL 6-month schedule ── */
router.post('/fill-schedule', async (req, res) => {
  try {
    const routine = await Routine.findOne({ userId: req.user.userId });
    if (!routine) return res.status(400).json({ error: 'No routine found.' });

    const hasAny = WEEK_DAYS.some(d => routine[d] && routine[d].length > 0);
    if (!hasAny) return res.status(400).json({ error: 'Routine template is empty.' });

    const today = new Date();
    today.setHours(0,0,0,0);
    const toInsert = [];

    for (let week = 0; week < 26; week++) {
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date    = new Date(today);
        date.setDate(today.getDate() + (week * 7) + dayOffset);
        const dayKey  = DOW_MAP[date.getDay()];
        const dateStr = toDateStr(date);
        const template = routine[dayKey] || [];
        if (template.length === 0) continue;

        const firstStrengthIdx = template.findIndex(ex => ex.type === 'strength');

        for (let i = 0; i < template.length; i++) {
          const ex = template[i];
          const exists = await Exercise.exists({ userId: req.user.userId, date: dateStr, name: ex.name });
          if (exists) continue;

          const overloadCycles = Math.floor(week / 3);
          const overload = (i === firstStrengthIdx && ex.type === 'strength')
            ? overloadCycles * 5 : 0;

          const doc = {
            userId:        req.user.userId,
            date:          dateStr,
            name:          ex.name,
            category:      ex.category,
            type:          ex.type,
            notes:         ex.notes || null,
            isProgressive: i === firstStrengthIdx && ex.type === 'strength',
            scheduleWeek:  week + 1,
          };

          if (ex.type === 'strength') {
            doc.weight = Math.round(((ex.weight || 0) + overload) * 10) / 10;
            doc.sets   = ex.sets;
            doc.reps   = ex.reps;
          } else {
            doc.duration     = ex.duration;
            doc.durationUnit = ex.durationUnit || 'minutes';
          }
          toInsert.push(doc);
        }
      }
    }

    if (toInsert.length === 0) {
      return res.json({ inserted: 0 });
    }
    await Exercise.insertMany(toInsert, { ordered: false });
    res.json({ inserted: toInsert.length });
  } catch (err) {
    res.status(500).json({ error: 'Schedule fill failed: ' + err.message });
  }
});

/* ── CLEAR a weekday from schedule ── */
router.delete('/clear-day/:weekday', async (req, res) => {
  const validDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const weekday   = req.params.weekday.toLowerCase();
  if (!validDays.includes(weekday)) return res.status(400).json({ error: 'Invalid weekday' });

  const dowMap = { sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6 };
  const targetDow = dowMap[weekday];

  try {
    const all = await Exercise.find({ userId: req.user.userId }).select('date _id');
    const toDelete = all
      .filter(ex => new Date(ex.date + 'T00:00:00').getDay() === targetDow)
      .map(ex => ex._id);

    let deletedCount = 0;
    if (toDelete.length > 0) {
      const r = await Exercise.deleteMany({ _id: { $in: toDelete } });
      deletedCount = r.deletedCount;
    }

    const routine = await Routine.findOne({ userId: req.user.userId });
    if (routine) { routine[weekday] = []; await routine.save(); }

    res.json({ deleted: deletedCount, weekday });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear day' });
  }
});

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

module.exports = router;
