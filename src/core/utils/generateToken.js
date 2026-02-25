/**
 * JWT token generator for authenticated user.
 * backend/src/core/utils/generateToken.js
 */

import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES } from '../../config/jwt.js';

/**
 * @param {Object} user - User record (id, role from Prisma users table)
 * @returns {string} JWT token
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
};
