// backend/src/modules/teachers/teacher.repository.js
// Repository helpers for teacher registration.

import { prisma } from '../../lib/prisma.js';

export async function findUserByUsernameOrEmail(username, email) {
  return prisma.users.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });
}

export async function createUser(data) {
  return prisma.users.create({
    data: {
      username: data.username,
      email: data.email,
      password_hash: data.password_hash,
      role: data.role ?? 'TEACHER',
    },
  });
}

export async function createTeacher(data) {
  return prisma.teachers.create({
    data: {
      user_id: data.user_id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email ?? null,
      status: data.status ?? 'active',
    },
  });
}

