// backend/src/modules/classes/class.service.js
import { prisma } from '../../lib/prisma.js';
import * as classRepository from './class.repository.js';

export async function bulkAssignSubjects({ class_id, subject_ids }) {
  const classId = Number(class_id);
  const subjectIds = subject_ids.map(Number);

  return prisma.$transaction(async (tx) => {
    const cls = await tx.classes.findUnique({ where: { id: classId } });
    if (!cls) {
      const err = new Error('Class not found');
      err.code = 'NOT_FOUND';
      err.field = 'class_id';
      throw err;
    }

    const existingSubjects = await tx.subjects.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingSubjects.map((s) => s.id));
    const missing = subjectIds.filter((id) => !existingIds.has(id));
    if (missing.length) {
      const err = new Error(`Subjects not found: ${missing.join(', ')}`);
      err.code = 'VALIDATION';
      err.field = 'subject_ids';
      throw err;
    }

    const existingLinks = await tx.subject_classes.findMany({
      where: {
        class_id: classId,
        subject_id: { in: subjectIds },
      },
      select: { subject_id: true },
    });
    if (existingLinks.length) {
      const already = existingLinks.map((r) => r.subject_id);
      const err = new Error(
        `Some subjects are already assigned to this class: ${already.join(', ')}`
      );
      err.code = 'DUPLICATE_SUBJECTS';
      throw err;
    }

    await tx.subject_classes.createMany({
      data: subjectIds.map((subjectId) => ({
        class_id: classId,
        subject_id: subjectId,
      })),
    });

    return { class_id: classId, subject_ids: subjectIds };
  });
}

export async function assignTeacherToSubject({ teacher_id, class_id, subject_id }) {
  const teacherId = Number(teacher_id);
  const classId = Number(class_id);
  const subjectId = Number(subject_id);

  const teacher = await classRepository.findTeacherById(teacherId);
  if (!teacher) {
    const err = new Error('Teacher not found');
    err.code = 'NOT_FOUND';
    err.field = 'teacher_id';
    throw err;
  }

  const link = await classRepository.findClassSubjectLink(classId, subjectId);
  if (!link) {
    const err = new Error('Subject is not assigned to this class');
    err.code = 'SUBJECT_NOT_IN_CLASS';
    throw err;
  }

  const existing = await classRepository.findTeacherClassSubject(
    teacherId,
    classId,
    subjectId
  );
  if (existing) {
    const err = new Error('Teacher is already assigned to this subject in this class');
    err.code = 'DUPLICATE_ASSIGNMENT';
    throw err;
  }

  return classRepository.createTeacherClassSubject(teacherId, classId, subjectId);
}

