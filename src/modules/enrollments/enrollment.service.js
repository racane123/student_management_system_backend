// backend/src/modules/enrollments/enrollment.service.js

import { prisma } from '../../lib/prisma.js';
import {
  findClassById,
  findStudentsByIds,
  findExistingEnrollments,
  createManyEnrollments,
  findActiveEnrollment,
} from './enrollment.repository.js';

export async function bulkEnrollStudents({ student_ids, class_id, academic_year }) {
  const cls = await findClassById(class_id);
  if (!cls) {
    const err = new Error('Class not found');
    err.code = 'CLASS_NOT_FOUND';
    throw err;
  }

  const existingStudents = await findStudentsByIds(student_ids);
  const existingIds = new Set(existingStudents.map((s) => s.id));
  const invalidIds = student_ids.filter((id) => !existingIds.has(Number(id)));
  if (invalidIds.length) {
    const err = new Error(`Some students not found: ${invalidIds.join(', ')}`);
    err.code = 'STUDENT_NOT_FOUND';
    err.meta = { invalidIds };
    throw err;
  }

  const already = await findExistingEnrollments(student_ids, class_id, academic_year);
  const alreadyIds = new Set(already.map((e) => e.student_id));
  const toInsert = student_ids
    .map(Number)
    .filter((id) => !alreadyIds.has(id))
    .map((student_id) => ({
      student_id,
      class_id: Number(class_id),
      academic_year,
      status: 'ENROLLED',
    }));

  if (!toInsert.length) {
    return { createdCount: 0, skippedCount: student_ids.length };
  }

  const { count } = await prisma.$transaction(async () => {
    return await createManyEnrollments(toInsert);
  });

  return { createdCount: count, skippedCount: student_ids.length - count };
}

export async function transferStudent({ student_id, from_class_id, to_class_id, academic_year }) {
  return prisma.$transaction(async (tx) => {
    const active = await findActiveEnrollment(student_id, from_class_id, academic_year);
    if (!active) {
      const err = new Error('Active enrollment not found for source class');
      err.code = 'ENROLLMENT_NOT_FOUND';
      throw err;
    }

    await tx.enrollments.update({
      where: { id: active.id },
      data: {
        status: 'TRANSFERRED',
        ended_at: new Date(),
      },
    });

    await tx.enrollments.create({
      data: {
        student_id: Number(student_id),
        class_id: Number(to_class_id),
        academic_year,
        status: 'ENROLLED',
        started_at: new Date(),
      },
    });

    return { from_enrollment_id: active.id };
  });
}

