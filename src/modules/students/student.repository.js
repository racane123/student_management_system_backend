/**
 * backend/src/modules/students/student.repository.js
 * Repository layer: CRUD for students, users, and student_accounts using Prisma fluent API.
 */

import { prisma } from '../../lib/prisma.js';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

/**
 * Find user by username or email (for duplicate check).
 */
export async function findUserByUsernameOrEmail(username, email) {
  return prisma.users.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });
}

/**
 * Create a user record (used inside transaction).
 */
export async function createUser(data) {
  return prisma.users.create({
    data: {
      username: data.username,
      email: data.email,
      password_hash: data.password_hash,
      role: data.role ?? 'STUDENT',
    },
  });
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

/**
 * Get the next admission number sequence for a year (e.g. ADM-2024-0001).
 */
export async function getNextAdmissionSequence(year) {
  const prefix = `ADM-${year}-`;
  const last = await prisma.students.findFirst({
    where: { admission_no: { startsWith: prefix } },
    orderBy: { admission_no: 'desc' },
    select: { admission_no: true },
  });
  const nextNum = last
    ? parseInt(last.admission_no.slice(prefix.length), 10) + 1
    : 1;
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

/**
 * Create student profile (used inside transaction).
 */
export async function createStudent(data) {
  return prisma.students.create({
    data: {
      admission_no: data.admission_no,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: data.gender ?? null,
      date_of_birth: data.date_of_birth ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      class_id: data.class_id ?? null,
      guardian_name: data.guardian_name ?? null,
      guardian_phone: data.guardian_phone ?? null,
      profile_image: data.profile_image ?? null,
      status: data.status ?? 'active',
    },
  });
}

/**
 * Find student by id (with optional relations).
 */
export async function findStudentById(id, opts = {}) {
  return prisma.students.findUnique({
    where: { id: Number(id) },
    include:
      opts.include ??
      {
        class: true,
        student_accounts: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
  });
}

/**
 * List students with filters and pagination.
 */
export async function findManyStudents(params = {}) {
  const { page = 1, limit = 10, classId, status, search } = params;
  const skip = (page - 1) * limit;
  const where = {};
  if (classId) where.class_id = Number(classId);
  if (status) where.status = status;
  if (search && search.trim()) {
    where.OR = [
      { first_name: { contains: search.trim(), mode: 'insensitive' } },
      { last_name: { contains: search.trim(), mode: 'insensitive' } },
      { admission_no: { contains: search.trim(), mode: 'insensitive' } },
      { email: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }

  const [list, total] = await Promise.all([
    prisma.students.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        class: true,
        student_accounts: { include: { user: true } },
      },
    }),
    prisma.students.count({ where }),
  ]);

  return { list, total };
}

/**
 * Update student by id.
 */
export async function updateStudent(id, data) {
  return prisma.students.update({
    where: { id: Number(id) },
    data: {
      ...(data.admission_no != null && { admission_no: data.admission_no }),
      ...(data.first_name != null && { first_name: data.first_name }),
      ...(data.last_name != null && { last_name: data.last_name }),
      ...(data.gender != null && { gender: data.gender }),
      ...(data.date_of_birth != null && { date_of_birth: data.date_of_birth }),
      ...(data.email != null && { email: data.email }),
      ...(data.phone != null && { phone: data.phone }),
      ...(data.address != null && { address: data.address }),
      ...(data.class_id != null && { class_id: data.class_id }),
      ...(data.guardian_name != null && { guardian_name: data.guardian_name }),
      ...(data.guardian_phone != null && { guardian_phone: data.guardian_phone }),
      ...(data.profile_image != null && { profile_image: data.profile_image }),
      ...(data.status != null && { status: data.status }),
    },
  });
}

/**
 * Delete student by id (cascade will remove student_accounts; user deletion handled separately if needed).
 */
export async function deleteStudent(id) {
  return prisma.students.delete({
    where: { id: Number(id) },
  });
}

// ---------------------------------------------------------------------------
// Student accounts (link user_id <-> student_id)
// ---------------------------------------------------------------------------

/**
 * Create student_account link (used inside transaction).
 */
export async function createStudentAccount(userId, studentId) {
  return prisma.student_accounts.create({
    data: {
      user_id: userId,
      student_id: studentId,
    },
  });
}
