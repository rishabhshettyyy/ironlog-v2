/* ══════════════════════════════════════════════
   server/models/GymClosure.js
   Admin-created gym closure notices visible to
   all users on the calendar.
   Author: Rishabh
══════════════════════════════════════════════ */
const mongoose = require('mongoose');

const gymClosureSchema = new mongoose.Schema({
  // Admin who created the notice
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // "YYYY-MM-DD" — the date the gym is closed
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    default: 'Gym Closed',
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300,
  },
  // Optional end date for multi-day closures
  endDate: {
    type: String,
    default: null,
    match: /^\d{4}-\d{2}-\d{2}$/,
  },
}, { timestamps: true });

module.exports = mongoose.model('GymClosure', gymClosureSchema);
