/**
 * Auth service – login (access + refresh tokens), logout, refresh.
 * backend/src/modules/auth/auth.service.js
 */

import { findUserByUsername } from './auth.repository.js';
import { comparePassword } from '../../core/utils/hashPassword.js';
import { getPermissionsForRole } from './permission.repository.js';
import {
  generateAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
} from '../../core/services/tokenService.js';

export const loginUser = async (username, password) => {
  const user = await findUserByUsername(username);

  if (!user) {
    throw new Error('Invalid username or password');
  }

  const isMatch = await comparePassword(password, user.password_hash);

  if (!isMatch) {
    throw new Error('Invalid username or password');
  }

  const permissions = await getPermissionsForRole(user.role);
  const token = generateAccessToken(user, permissions);
  const refreshToken = await createRefreshToken(user.id);

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions,
    },
  };
};

export const refreshAccessToken = async (refreshToken) => {
  const result = await rotateRefreshToken(refreshToken);
  if (!result) {
    throw new Error('Invalid or expired refresh token');
  }
  return result;
};

export const logoutUser = async (refreshToken) => {
  await revokeRefreshToken(refreshToken);
};

export const revokeAllSessions = async (userId) => {
  await revokeAllUserSessions(userId);
};
