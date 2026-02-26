// backend/src/modules/classes/class.repository.js
import { prisma } from '../../lib/prisma.js';

export async function findClassById(id) {
  return prisma.classes.findUnique({ where: { id: Number(id) } });
}

export async function findSubjectsByIds(ids) {
  return prisma.subjects.findMany({
    where: { id: { in: ids.map(Number) } },
    select: { id: true },
  });
}

export async function bulkCreateClassSubjects(classId, subjectIds) {
  return prisma.subject_classes.createMany({
    data: subjectIds.map((subjectId) => ({
      class_id: Number(classId),
      subject_id: Number(subjectId),
    })),
    skipDuplicates: false,
  });
}

export async function findTeacherById(id) {
  return prisma.teachers.findUnique({ where: { id: Number(id) } });
}

export async function findClassSubjectLink(classId, subjectId) {
  return prisma.subject_classes.findFirst({
    where: { class_id: Number(classId), subject_id: Number(subjectId) },
  });
}

export async function findTeacherClassSubject(teacherId, classId, subjectId) {
  return prisma.teacher_class_subjects.findFirst({
    where: {
      teacher_id: Number(teacherId),
      class_id: Number(classId),
      subject_id: Number(subjectId),
    },
  });
}

export async function createTeacherClassSubject(teacherId, classId, subjectId) {
  return prisma.teacher_class_subjects.create({
    data: {
      teacher_id: Number(teacherId),
      class_id: Number(classId),
      subject_id: Number(subjectId),
    },
  });
}

export async function getAllClasses() {
  const classes = await prisma.classes.findMany({
    where: {},
    orderBy: [{ grade_level: 'asc' }, { section: 'asc' }],
    include: {
      adviser: {
        select: { id: true, first_name: true, last_name: true, email: true },
      },
      subjects: {
        include: {
          subject: {
            select: { id: true, name: true, code: true, status: true },
          },
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  return classes.map((c) => ({
    ...c,
    adviser: c.adviser
      ? {
          id: c.adviser.id,
          name: `${c.adviser.first_name} ${c.adviser.last_name}`.trim(),
          email: c.adviser.email,
        }
      : null,
    enrolled_count: c._count.enrollments,
    subjects: c.subjects.map((cs) => cs.subject),
  }));
}

