/* ══════════════════════════════════════════════
   server/models/HealthMetric.js
   Daily weight + calorie entries per user.
   One document per user per date.
   Author: Rishabh
══════════════════════════════════════════════ */
const mongoose = require('mongoose');

const healthMetricSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // "YYYY-MM-DD" — consistent with Exercise date format
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
  },
  weightKg: {
    type: Number,
    default: null,
    min: 20,
    max: 500,
  },
  caloriesKcal: {
    type: Number,
    default: null,
    min: 0,
    max: 20000,
  },
  notes: {
    type: String,
    default: null,
    maxlength: 300,
  },
}, { timestamps: true });

// One entry per user per date
healthMetricSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HealthMetric', healthMetricSchema);
