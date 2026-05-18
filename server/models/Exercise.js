/* ══════════════════════════════════════════════
   server/models/Exercise.js — Exercise schema
   Extended from Assignment 1 with userId scoping
   Author: Rishabh
══════════════════════════════════════════════ */
const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  // Owner of this exercise entry
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // "YYYY-MM-DD" string — avoids timezone shift issues
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
    index: true,
  },

  name:     { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, required: true, trim: true },

  type: {
    type: String,
    enum: ['strength', 'cardio'],
    required: true,
  },

  // Strength fields
  weight: { type: Number, default: null },
  sets:   { type: Number, default: null },
  reps:   { type: Number, default: null },

  // Cardio fields
  duration:     { type: Number, default: null },
  durationUnit: { type: String, enum: ['minutes', 'hours'], default: 'minutes' },

  notes: { type: String, default: null, maxlength: 500 },

  isProgressive: { type: Boolean, default: false },
  scheduleWeek:  { type: Number, default: null },

}, { timestamps: true });

// Compound index for fast per-user date queries
exerciseSchema.index({ userId: 1, date: 1 });
exerciseSchema.index({ userId: 1, date: 1, type: 1 });

module.exports = mongoose.model('Exercise', exerciseSchema);
