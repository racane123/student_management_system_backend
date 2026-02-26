// backend/src/modules/teachers/teacher.service.js
// Service layer: registerTeacher using prisma.$transaction.

import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../core/utils/hashPassword.js';
import { findUserByUsernameOrEmail, createUser, createTeacher } from './teacher.repository.js';

/**
 * Register a new teacher: creates user (credentials + TEACHER role) and teacher profile.
 * Uses a single Prisma transaction so that if one step fails, everything rolls back.
 *
 * @param {Object} payload - Validated registration payload (see teacher.validation.js)
 * @returns {Promise<{ user, teacher }>}
 */
export async function registerTeacher(payload) {
  const existing = await findUserByUsernameOrEmail(payload.username, payload.email);
  if (existing) {
    const field = existing.username === payload.username ? 'username' : 'email';
    const err = new Error(`User already exists with this ${field}.`);
    err.code = 'USER_EXISTS';
    throw err;
  }

  const password_hash = await hashPassword(payload.password);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.users.create({
      data: {
        username: payload.username,
        email: payload.email,
        password_hash,
        role: 'TEACHER',
      },
    });

    const teacher = await tx.teachers.create({
      data: {
        user_id: user.id,
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email ?? null,
        status: payload.status ?? 'active',
      },
    });

    return { user, teacher };
  });

  return result;
}

export default {
  registerTeacher,
};

