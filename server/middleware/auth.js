/* ══════════════════════════════════════════════
   server/middleware/auth.js
   JWT verification + role-based access control
   Author: Rishabh
══════════════════════════════════════════════ */
const jwt = require('jsonwebtoken');

/**
 * Verifies the JWT in the Authorization header.
 * Attaches decoded user payload to req.user.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

/**
 * Requires the authenticated user to have the 'admin' role.
 * Must be used AFTER requireAuth.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
