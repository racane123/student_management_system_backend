/**
 * backend/src/modules/exams/exam.service.js
 * Business logic: duplicate check, FK validation (class, subject, subject-class link).
 */

import * as examRepository from './exam.repository.js';

/**
 * Create exam. Validates: class exists, subject exists, subject offered in class, no duplicate (class+subject+name).
 */
export async function createExam(payload) {
  const classId = Number(payload.classId ?? payload.class_id);
  const subjectId = Number(payload.subjectId ?? payload.subject_id);
  const name = (payload.name ?? '').toString().trim();

  if (!classId || !subjectId || !name) {
    const err = new Error('Class, subject, and name are required.');
    err.code = 'VALIDATION';
    throw err;
  }

  const [cls, subj, link, duplicate] = await Promise.all([
    examRepository.findClassById(classId),
    examRepository.findSubjectById(subjectId),
    examRepository.findSubjectClassLink(subjectId, classId),
    examRepository.findDuplicateExam(classId, subjectId, name, null),
  ]);

  if (!cls) {
    const err = new Error('Class not found.');
    err.code = 'NOT_FOUND';
    err.field = 'classId';
    throw err;
  }
  if (!subj) {
    const err = new Error('Subject not found.');
    err.code = 'NOT_FOUND';
    err.field = 'subjectId';
    throw err;
  }
  if (!link) {
    const err = new Error('Subject is not offered in this class.');
    err.code = 'VALIDATION';
    throw err;
  }
  if (duplicate) {
    const err = new Error('An exam with the same class, subject, and name already exists.');
    err.code = 'DUPLICATE';
    throw err;
  }

  const totalMarks = Number(payload.totalMarks ?? payload.total_marks ?? 100);
  const passingMarks = Number(payload.passingMarks ?? payload.passing_marks ?? 40);
  if (passingMarks > totalMarks) {
    const err = new Error('Passing marks cannot exceed total marks.');
    err.code = 'VALIDATION';
    throw err;
  }

  const data = {
    name,
    class_id: classId,
    subject_id: subjectId,
    exam_date: payload.examDate ?? payload.exam_date ?? '',
    start_time: payload.startTime ?? payload.start_time ?? '09:00',
    end_time: payload.endTime ?? payload.end_time ?? '11:00',
    total_marks: totalMarks,
    passing_marks: passingMarks,
    status: payload.status ?? 'Scheduled',
  };

  return examRepository.createExam(data);
}

/**
 * Update exam. Same validations as create for changed fields; duplicate check excludes current id.
 */
export async function updateExam(id, payload) {
  const existing = await examRepository.findExamById(id);
  if (!existing) {
    const err = new Error('Exam not found.');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const classId = Number(payload.classId ?? payload.class_id ?? existing.class_id);
  const subjectId = Number(payload.subjectId ?? payload.subject_id ?? existing.subject_id);
  const name = (payload.name ?? existing.name).toString().trim();

  const [cls, subj, link, duplicate] = await Promise.all([
    examRepository.findClassById(classId),
    examRepository.findSubjectById(subjectId),
    examRepository.findSubjectClassLink(subjectId, classId),
    examRepository.findDuplicateExam(classId, subjectId, name, id),
  ]);

  if (!cls) {
    const err = new Error('Class not found.');
    err.code = 'NOT_FOUND';
    err.field = 'classId';
    throw err;
  }
  if (!subj) {
    const err = new Error('Subject not found.');
    err.code = 'NOT_FOUND';
    err.field = 'subjectId';
    throw err;
  }
  if (!link) {
    const err = new Error('Subject is not offered in this class.');
    err.code = 'VALIDATION';
    throw err;
  }
  if (duplicate) {
    const err = new Error('An exam with the same class, subject, and name already exists.');
    err.code = 'DUPLICATE';
    throw err;
  }

  const examDate = payload.examDate ?? payload.exam_date ?? existing.exam_date;
  const startTime = payload.startTime ?? payload.start_time ?? existing.start_time;
  const endTime = payload.endTime ?? payload.end_time ?? existing.end_time;
  const totalMarks = payload.totalMarks ?? payload.total_marks ?? existing.total_marks;
  const passingMarks = payload.passingMarks ?? payload.passing_marks ?? existing.passing_marks;
  const status = payload.status ?? existing.status;

  if (Number(passingMarks) > Number(totalMarks)) {
    const err = new Error('Passing marks cannot exceed total marks.');
    err.code = 'VALIDATION';
    throw err;
  }

  const data = {
    name,
    class_id: classId,
    subject_id: subjectId,
    exam_date: examDate,
    start_time: startTime,
    end_time: endTime,
    total_marks: Number(totalMarks),
    passing_marks: Number(passingMarks),
    status,
  };

  return examRepository.updateExam(id, data);
}
