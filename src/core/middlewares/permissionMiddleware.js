/**
 * Permission Middleware – PBAC with JWT-backed permissions.
 *
 * Strategy: Permissions are included in the JWT payload at login/refresh.
 * authMiddleware decodes the token and sets req.user.permissions.
 * No DB or cache lookup here—zero queries per request.
 */

/**
 * Require permissions. Use after authMiddleware.
 * SUPER_ADMIN bypasses all checks (has all permissions).
 *
 * @param {string|string[]} requiredPermissions – single permission or array
 * @param {Object} options
 * @param {'AND'|'OR'} options.mode – AND: must have all; OR: must have at least one
 */
export function permissionMiddleware(requiredPermissions, options = {}) {
  const { mode = 'AND' } = options;
  const required = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const role = req.user.role;
    if (!role) {
      return res.status(403).json({ message: 'No role assigned.' });
    }

    if (role === 'SUPER_ADMIN') {
      return next();
    }

    const permissions = req.user.permissions ?? [];

    if (mode === 'OR') {
      const hasAny = required.some((p) => permissions.includes(p));
      if (!hasAny) {
        return res.status(403).json({ message: 'Insufficient permissions.' });
      }
    } else {
      const hasAll = required.every((p) => permissions.includes(p));
      if (!hasAll) {
        return res.status(403).json({ message: 'Insufficient permissions.' });
      }
    }

    next();
  };
}
