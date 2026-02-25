/**
 * Auth controller – login, refresh, logout.
 * backend/src/modules/auth/auth.controller.js
 */

import { loginUser, refreshAccessToken, logoutUser, revokeAllSessions } from './auth.service.js';
import { getRolePermissions } from './permission.service.js';
import { safeParseLogin } from './auth.validation.js';

export const login = async (req, res, next) => {
  try {
    const parsed = safeParseLogin(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { username, password } = parsed.data;
    const data = await loginUser(username, password);

    res.status(200).json({
      message: 'Login successful',
      ...data,
    });
  } catch (error) {
    res.status(401).json({ message: error.message || 'Invalid username or password' });
  }
};

/**
 * POST /auth/refresh
 * Body: { refreshToken }
 * Token Rotation: old refresh token invalidated, new one issued.
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }

    const data = await refreshAccessToken(refreshToken);

    res.status(200).json({
      message: 'Token refreshed',
      token: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    });
  } catch (error) {
    res.status(401).json({ message: error.message || 'Invalid or expired refresh token' });
  }
};

/**
 * POST /auth/logout
 * Body: { refreshToken }
 * Revokes the refresh token server-side so the session is ended.
 */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await logoutUser(refreshToken);
    }
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/revoke-all
 * Security Reset: revoke all refresh tokens for the authenticated user.
 * Requires authMiddleware. Typically Admin/SuperAdmin only.
 */
export const revokeAll = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    await revokeAllSessions(userId);
    res.status(200).json({ message: 'All sessions revoked' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/role-permissions
 * Admin Dashboard: all roles with their permissions (for toggle UI).
 */
export const rolePermissions = async (req, res, next) => {
  try {
    const data = await getRolePermissions();
    res.json(data);
  } catch (error) {
    next(error);
  }
};
