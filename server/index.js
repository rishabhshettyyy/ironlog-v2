/* ══════════════════════════════════════════════
   server/index.js — IronLog v2 Express server
   Author: Rishabh
══════════════════════════════════════════════ */
require('dotenv').config();

const express            = require('express');
const connectDB          = require('./db');
const authRoutes         = require('./routes/auth');
const exerciseRoutes     = require('./routes/exercises');
const routineRoutes      = require('./routes/routine');
const healthMetricRoutes = require('./routes/healthMetrics');
const gymClosureRoutes   = require('./routes/gymClosures');
const adminRoutes        = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3001;

/* ── CORS — allow all origins for local dev ── */
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

/* ── Routes ── */
app.use('/api/auth',           authRoutes);
app.use('/api/exercises',      exerciseRoutes);
app.use('/api/routine',        routineRoutes);
app.use('/api/health-metrics', healthMetricRoutes);
app.use('/api/gym-closures',   gymClosureRoutes);
app.use('/api/admin',          adminRoutes);

/* ── Health check ── */
app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '2.0.0' }));

/* ── 404 ── */
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

/* ── Global error handler ── */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/* ── Boot ── */
(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✓ IronLog v2 running → http://localhost:${PORT}`);
    console.log(`  Health: http://localhost:${PORT}/api/health`);
  });
})();
