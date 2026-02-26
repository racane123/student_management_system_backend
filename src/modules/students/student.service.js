/**
 * backend/src/modules/students/student.service.js
 * Service layer: registerStudent using prisma.$transaction.
 * Flow: hash password -> generate admission_no -> create User -> create Student -> create student_accounts.
 * On any failure, the entire transaction rolls back.
 */

import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { findUserByUsernameOrEmail, findManyStudents } from './student.repository.js';

const SALT_ROUNDS = 10;

/**
 * Register a new student: creates user (credentials + STUDENT role), student profile, and student_accounts link.
 * Uses a single Prisma transaction so that if one step fails, everything rolls back.
 *
 * @param {Object} payload - Validated registration payload (see student.validation.js)
 * @returns {Promise<{ user, student, student_account }>}
 * @throws {Error} User already exists | Database timeout | Validation/constraint errors
 */
export async function registerStudent(payload) {
  // 1. Duplicate check before entering transaction (avoids holding tx for hash)
  const existing = await findUserByUsernameOrEmail(payload.username, payload.email);
  if (existing) {
    const field = existing.username === payload.username ? 'username' : 'email';
    const err = new Error(`User already exists with this ${field}.`);
    err.code = 'USER_EXISTS';
    throw err;
  }

  // 2. Hash password outside transaction to avoid long-running tx
  const password_hash = await bcrypt.hash(payload.password, SALT_ROUNDS);

  // 3. Run all creates in one transaction; rollback on any failure
  const result = await prisma.$transaction(
    async (tx) => {
      const year = new Date().getFullYear();
      const prefix = `ADM-${year}-`;
      const last = await tx.students.findFirst({
        where: { admission_no: { startsWith: prefix } },
        orderBy: { admission_no: 'desc' },
        select: { admission_no: true },
      });
      const nextNum = last ? parseInt(last.admission_no.slice(prefix.length), 10) + 1 : 1;
      const admission_no = `${prefix}${String(nextNum).padStart(4, '0')}`;

      // Step A: Create user (credentials + STUDENT role)
      const user = await tx.users.create({
        data: {
          username: payload.username,
          email: payload.email,
          password_hash,
          role: 'STUDENT',
        },
      });

      // Step B: Create student profile (personal details + admission_no)
      const student = await tx.students.create({
        data: {
          admission_no,
          first_name: payload.first_name,
          last_name: payload.last_name,
          gender: payload.gender ?? null,
          date_of_birth: payload.date_of_birth ?? null,
          email: payload.email ?? null,
          phone: payload.phone ?? null,
          address: payload.address ?? null,
          class_id: payload.class_id ?? null,
          guardian_name: payload.guardian_name ?? null,
          guardian_phone: payload.guardian_phone ?? null,
          status: payload.status ?? 'active',
        },
      });

      // Step C: Link user_id to student_id
      const student_account = await tx.student_accounts.create({
        data: {
          user_id: user.id,
          student_id: student.id,
        },
      });

      return { user, student, student_account };
    },
    {
      maxWait: 10_000,
      timeout: 15_000,
    }
  );

  return result;
}

export async function getStudents(query) {
  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 10;

  return findManyStudents({
    page,
    limit,
    classId: query.class_id || query.classId || undefined,
    status: query.status || undefined,
    search: query.search || undefined,
  });
}

export default {
  registerStudent,
  getStudents,
};
