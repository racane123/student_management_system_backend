/**
 * backend/src/core/middlewares/authMiddleware.js
 * Verifies JWT, attaches user (id, role) to req.user.
 */

import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config/jwt.js';

/**
 * Middleware: require valid JWT. Sets req.user = { userId, role }.
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
}
