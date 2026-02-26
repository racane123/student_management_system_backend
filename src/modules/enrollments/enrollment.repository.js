// backend/src/modules/enrollments/enrollment.repository.js

import { prisma } from '../../lib/prisma.js';

export async function findClassById(class_id) {
  return prisma.classes.findUnique({ where: { id: Number(class_id) } });
}

export async function findStudentsByIds(student_ids) {
  return prisma.students.findMany({
    where: { id: { in: student_ids.map(Number) } },
    select: { id: true },
  });
}

export async function findExistingEnrollments(student_ids, class_id, academic_year) {
  return prisma.enrollments.findMany({
    where: {
      class_id: Number(class_id),
      academic_year,
      student_id: { in: student_ids.map(Number) },
    },
    select: { student_id: true },
  });
}

export async function createManyEnrollments(rows) {
  if (!rows.length) return { count: 0 };
  return prisma.enrollments.createMany({
    data: rows,
    skipDuplicates: true,
  });
}

export async function findAllEnrollments(params = {}) {
  const { page = 1, limit = 20, academic_year, class_id } = params;
  const take = Number(limit) || 20;
  const skip = (Number(page) - 1) * take;

  const where = {};
  if (academic_year) where.academic_year = academic_year;
  if (class_id) where.class_id = Number(class_id);

  const [list, total] = await Promise.all([
    prisma.enrollments.findMany({
      where,
      skip,
      take,
      orderBy: [{ academic_year: 'desc' }, { started_at: 'desc' }],
      include: {
        student: true,
        class: true,
      },
    }),
    prisma.enrollments.count({ where }),
  ]);

  return { list, total };
}

export async function getStudentEnrollmentHistory(student_id) {
  return prisma.enrollments.findMany({
    where: { student_id: Number(student_id) },
    orderBy: [{ academic_year: 'asc' }, { started_at: 'asc' }],
    include: {
      class: true,
    },
  });
}

export async function updateEnrollmentStatus(id, data) {
  return prisma.enrollments.update({
    where: { id: Number(id) },
    data,
  });
}

export async function createEnrollment(data) {
  return prisma.enrollments.create({ data });
}

export async function findActiveEnrollment(student_id, class_id, academic_year) {
  return prisma.enrollments.findFirst({
    where: {
      student_id: Number(student_id),
      class_id: Number(class_id),
      academic_year,
      status: 'ENROLLED',
    },
  });
}

