/**
 * backend/src/modules/exams/exam.repository.js
 * Prisma-based CRUD for exams.
 */

import { prisma } from '../../lib/prisma.js';

export async function findExamById(id, opts = {}) {
  return prisma.exams.findUnique({
    where: { id: Number(id) },
    include: opts.include ?? { class: true, subject: true },
  });
}

export async function findDuplicateExam(classId, subjectId, name, excludeId = null) {
  const where = {
    class_id: Number(classId),
    subject_id: Number(subjectId),
    name: (name ?? '').toString().trim(),
  };
  if (excludeId != null) where.id = { not: Number(excludeId) };
  return prisma.exams.findFirst({ where });
}

export async function findManyExams(params = {}) {
  const { page = 1, limit = 10, classId, date, search } = params;
  const skip = (page - 1) * limit;
  const where = {};
  if (classId) where.class_id = Number(classId);
  if (date) where.exam_date = date;
  if (search && search.trim()) {
    where.name = { contains: search.trim(), mode: 'insensitive' };
  }
  const [list, total] = await Promise.all([
    prisma.exams.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ exam_date: 'asc' }, { start_time: 'asc' }],
      include: { class: true, subject: true },
    }),
    prisma.exams.count({ where }),
  ]);
  return { list, total };
}

export async function createExam(data) {
  return prisma.exams.create({
    data: {
      name: data.name,
      class_id: data.class_id,
      subject_id: data.subject_id,
      exam_date: data.exam_date,
      start_time: data.start_time,
      end_time: data.end_time,
      total_marks: data.total_marks ?? 100,
      passing_marks: data.passing_marks ?? 40,
      status: data.status ?? 'Scheduled',
    },
    include: { class: true, subject: true },
  });
}

export async function updateExam(id, data) {
  return prisma.exams.update({
    where: { id: Number(id) },
    data: {
      ...(data.name != null && { name: data.name }),
      ...(data.class_id != null && { class_id: data.class_id }),
      ...(data.subject_id != null && { subject_id: data.subject_id }),
      ...(data.exam_date != null && { exam_date: data.exam_date }),
      ...(data.start_time != null && { start_time: data.start_time }),
      ...(data.end_time != null && { end_time: data.end_time }),
      ...(data.total_marks != null && { total_marks: data.total_marks }),
      ...(data.passing_marks != null && { passing_marks: data.passing_marks }),
      ...(data.status != null && { status: data.status }),
    },
    include: { class: true, subject: true },
  });
}

export async function deleteExam(id) {
  return prisma.exams.delete({ where: { id: Number(id) } });
}

export async function findClassById(id) {
  return prisma.classes.findUnique({ where: { id: Number(id) } });
}

export async function findSubjectById(id) {
  return prisma.subjects.findUnique({ where: { id: Number(id) } });
}

export async function findSubjectClassLink(subjectId, classId) {
  return prisma.subject_classes.findFirst({
    where: { subject_id: Number(subjectId), class_id: Number(classId) },
  });
}
