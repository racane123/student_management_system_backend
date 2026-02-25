/**
 * JWT config – secret and expiry from env.
 * backend/src/config/jwt.js
 */

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-change-in-production';
export const JWT_EXPIRES = process.env.JWT_EXPIRES || '15m';
export const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';
