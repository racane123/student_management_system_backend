/**
 * backend/src/modules/exams/exam.service.js
 * Business logic: duplicate check, date conflict, FK validation (class, subject, subject-class link).
 * Throws errors with human-readable messages for controller (class name, subject name, exam name).
 */

import * as examRepository from './exam.repository.js';

function classDisplayName(cls) {
  if (!cls) return 'Unknown class';
  if (cls.class_name) return cls.class_name;
  const parts = [cls.grade_level, cls.section].filter(Boolean);
  return parts.length ? parts.join('-') : `Class ${cls.id}`;
}

/**
 * Create exam. Validates: class exists, subject exists, subject offered in class;
 * no duplicate (same class_id + subject_id + exam_name); no date conflict (class already has exam on exam_date).
 */
export async function createExam(payload) {
  const classId = Number(payload.classId ?? payload.class_id);
  const subjectId = Number(payload.subjectId ?? payload.subject_id);
  const name = (payload.name ?? '').toString().trim();
  const examDate = (payload.examDate ?? payload.exam_date ?? '').toString().trim();

  if (!classId || !subjectId || !name) {
    const err = new Error('Class, subject, and name are required.');
    err.code = 'VALIDATION';
    throw err;
  }

  const [cls, subj, link, duplicate, dateConflict] = await Promise.all([
    examRepository.findClassById(classId),
    examRepository.findSubjectById(subjectId),
    examRepository.findSubjectClassLink(subjectId, classId),
    examRepository.findDuplicateExam(classId, subjectId, name, null),
    examRepository.findExamOnDateForClass(classId, examDate || '0000-00-00', null),
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
    const err = new Error(
      `Class ${classDisplayName(cls)} already has a ${name} scheduled for ${subj.name}.`
    );
    err.code = 'DUPLICATE';
    throw err;
  }
  if (dateConflict && examDate) {
    const err = new Error(
      `Class ${classDisplayName(cls)} already has an exam scheduled on ${examDate} (${dateConflict.subject?.name ?? 'another subject'}).`
    );
    err.code = 'CONFLICT_DATE';
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
    exam_date: examDate || (payload.examDate ?? payload.exam_date ?? ''),
    start_time: payload.startTime ?? payload.start_time ?? '09:00',
    end_time: payload.endTime ?? payload.end_time ?? '11:00',
    total_marks: totalMarks,
    passing_marks: passingMarks,
    status: payload.status ?? 'PENDING',
  };

  return examRepository.createExam(data);
}

/**
 * Update exam. Same validations as create for changed fields; duplicate and date-conflict checks exclude current id.
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
  const examDate = (payload.examDate ?? payload.exam_date ?? existing.exam_date ?? '').toString().trim();

  const [cls, subj, link, duplicate, dateConflict] = await Promise.all([
    examRepository.findClassById(classId),
    examRepository.findSubjectById(subjectId),
    examRepository.findSubjectClassLink(subjectId, classId),
    examRepository.findDuplicateExam(classId, subjectId, name, id),
    examRepository.findExamOnDateForClass(classId, examDate || '0000-00-00', id),
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
    const err = new Error(
      `Class ${classDisplayName(cls)} already has a ${name} scheduled for ${subj.name}.`
    );
    err.code = 'DUPLICATE';
    throw err;
  }
  if (dateConflict && examDate) {
    const err = new Error(
      `Class ${classDisplayName(cls)} already has an exam scheduled on ${examDate} (${dateConflict.subject?.name ?? 'another subject'}).`
    );
    err.code = 'CONFLICT_DATE';
    throw err;
  }

  const totalMarks = payload.totalMarks ?? payload.total_marks ?? existing.total_marks;
  const passingMarks = payload.passingMarks ?? payload.passing_marks ?? existing.passing_marks;
  const status = payload.status ?? existing.status ?? 'PENDING';

  if (Number(passingMarks) > Number(totalMarks)) {
    const err = new Error('Passing marks cannot exceed total marks.');
    err.code = 'VALIDATION';
    throw err;
  }

  const data = {
    name,
    class_id: classId,
    subject_id: subjectId,
    exam_date: examDate || existing.exam_date,
    start_time: payload.startTime ?? payload.start_time ?? existing.start_time,
    end_time: payload.endTime ?? payload.end_time ?? existing.end_time,
    total_marks: Number(totalMarks),
    passing_marks: Number(passingMarks),
    status,
  };

  return examRepository.updateExam(id, data);
}
