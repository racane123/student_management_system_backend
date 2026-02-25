/**
 * backend/src/core/middlewares/roleMiddleware.js
 * Restricts access by role. Use after authMiddleware.
 * Roles: SUPER_ADMIN (1), ADMIN (2), REGISTRAR (3), TEACHER (4), STUDENT (5)
 * Can pass role IDs (1,2,3) or names (SUPER_ADMIN, ADMIN, REGISTRAR).
 */

const ROLE_MAP = {
  1: 'SUPER_ADMIN',
  2: 'ADMIN',
  3: 'REGISTRAR',
  4: 'TEACHER',
  5: 'STUDENT',
};

/**
 * @param {number[]|string[]} allowedRoles - e.g. [1, 2, 3] or ['ADMIN', 'REGISTRAR']
 */
export function roleMiddleware(allowedRoles) {
  const allowed = new Set(
    allowedRoles.map((r) => (typeof r === 'number' ? ROLE_MAP[r] : r?.toUpperCase()))
  );

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const role = typeof req.user.role === 'number' ? ROLE_MAP[req.user.role] : req.user.role?.toUpperCase();
    if (allowed.has(role)) {
      return next();
    }
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  };
}
