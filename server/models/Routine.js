/* ══════════════════════════════════════════════
   server/models/Routine.js — Weekly routine schema
   One document per user (not a global singleton)
   Author: Rishabh
══════════════════════════════════════════════ */
const mongoose = require('mongoose');

const templateExerciseSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  category:     { type: String, required: true },
  type:         { type: String, enum: ['strength', 'cardio'], required: true },
  weight:       { type: Number, default: 0 },
  sets:         { type: Number, default: null },
  reps:         { type: Number, default: null },
  duration:     { type: Number, default: null },
  durationUnit: { type: String, enum: ['minutes', 'hours'], default: 'minutes' },
  notes:        { type: String, default: null },
}, { _id: true });

const routineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,  // one routine per user
    index: true,
  },
  monday:    { type: [templateExerciseSchema], default: [] },
  tuesday:   { type: [templateExerciseSchema], default: [] },
  wednesday: { type: [templateExerciseSchema], default: [] },
  thursday:  { type: [templateExerciseSchema], default: [] },
  friday:    { type: [templateExerciseSchema], default: [] },
  saturday:  { type: [templateExerciseSchema], default: [] },
  sunday:    { type: [templateExerciseSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Routine', routineSchema);
