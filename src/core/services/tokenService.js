/**
 * Token Service – Refresh logic, rotation, revocation.
 *
 * Token Rotation: When a user refreshes, the old refresh token is invalidated
 * and a new one is issued. This prevents replay attacks—if a stolen token is
 * used, the legitimate user’s next refresh invalidates it, and the attacker
 * cannot obtain a new valid token.
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { JWT_SECRET, JWT_EXPIRES, JWT_REFRESH_EXPIRES } from '../../config/jwt.js';

const SALT = JWT_SECRET; // Use secret for HMAC; in prod consider a separate REFRESH_SECRET

/**
 * Hash a refresh token for secure storage.
 */
function hashRefreshToken(token) {
  return crypto.createHmac('sha256', SALT).update(token).digest('hex');
}

/**
 * Generate access token (short-lived).
 * Includes permissions in payload for zero-DB middleware lookup (if small).
 */
export function generateAccessToken(user, permissions = []) {
  const payload = {
    userId: user.id,
    role: user.role,
    ...(Array.isArray(permissions) && permissions.length <= 32 && { permissions }),
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/**
 * Generate refresh token (long-lived, stored hashed).
 */
function generateRefreshTokenRaw() {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Create and store a refresh token; return the raw token for the client.
 */
export async function createRefreshToken(userId) {
  const raw = generateRefreshTokenRaw();
  const expires_at = new Date(Date.now() + parseRefreshExpiry());
  await prisma.refresh_tokens.create({
    data: {
      user_id: userId,
      token_hash: hashRefreshToken(raw),
      expires_at,
    },
  });
  return raw;
}

function parseRefreshExpiry() {
  const s = JWT_REFRESH_EXPIRES;
  if (typeof s !== 'string') return 7 * 24 * 60 * 60 * 1000; // 7d default
  const m = s.match(/^(\d+)(d|h|m|s)$/);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const u = { d: 864e5, h: 36e5, m: 6e4, s: 1e3 }[m[2]] || 864e5;
  return n * u;
}

/**
 * Rotate refresh token: invalidate old, issue new (Token Rotation).
 * Returns { accessToken, refreshToken } or null if invalid.
 */
export async function rotateRefreshToken(rawRefreshToken) {
  const token_hash = hashRefreshToken(rawRefreshToken);

  const row = await prisma.refresh_tokens.findFirst({
    where: { token_hash },
    include: { user: true },
  });

  if (!row) return null;
  if (row.revoked_at) return null;
  if (row.expires_at < new Date()) return null;

  await prisma.refresh_tokens.update({
    where: { id: row.id },
    data: { revoked_at: new Date() },
  });

  const { getPermissionsForRole } = await import('../../modules/auth/permission.repository.js');
  const permissions = await getPermissionsForRole(row.user.role);

  const accessToken = generateAccessToken(row.user, permissions);
  const refreshToken = await createRefreshToken(row.user_id);

  return {
    accessToken,
    refreshToken,
    user: { id: row.user.id, username: row.user.username, email: row.user.email, role: row.user.role, permissions },
  };
}

/**
 * Revoke all refresh tokens for a user (Security Reset).
 */
export async function revokeAllUserSessions(userId) {
  await prisma.refresh_tokens.updateMany({
    where: { user_id: userId },
    data: { revoked_at: new Date() },
  });
}

/**
 * Revoke a specific refresh token (logout).
 */
export async function revokeRefreshToken(rawRefreshToken) {
  const token_hash = hashRefreshToken(rawRefreshToken);
  await prisma.refresh_tokens.updateMany({
    where: { token_hash },
    data: { revoked_at: new Date() },
  });
}
