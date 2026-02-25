/**
 * backend/src/modules/exams/exam.controller.js
 * Request/Response handling for exams CRUD.
 */

import * as examService from './exam.service.js';
import * as examRepository from './exam.repository.js';
import { safeParseCreateExam, safeParseUpdateExam } from './exam.validation.js';

/** Normalize exam for API (camelCase for frontend). */
function toApiExam(exam) {
  if (!exam) return null;
  return {
    ...exam,
    classId: exam.class_id,
    subjectId: exam.subject_id,
    examDate: exam.exam_date,
    startTime: exam.start_time,
    endTime: exam.end_time,
    totalMarks: exam.total_marks,
    passingMarks: exam.passing_marks,
    createdAt: exam.created_at,
    updatedAt: exam.updated_at,
  };
}

/**
 * POST /exams
 * Create exam. Only Admin, Registrar.
 */
export async function create(req, res, next) {
  try {
    const parsed = safeParseCreateExam(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const payload = parsed.data;
    const exam = await examService.createExam(payload);

    return res.status(201).json(toApiExam(exam));
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ message: err.message });
    }
    if (err.code === 'VALIDATION' || err.code === 'DUPLICATE') {
      return res.status(400).json({ message: err.message });
    }
    if (err?.code === 'P2002') {
      return res.status(409).json({
        message: 'An exam with the same class, subject, and name already exists.',
      });
    }
    next(err);
  }
}

/**
 * GET /exams
 * List exams with filters (search, classId, date) and pagination.
 */
export async function list(req, res, next) {
  try {
    const { page, limit, classId, date, search } = req.query;
    const result = await examRepository.findManyExams({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      classId: classId || undefined,
      date: date || undefined,
      search: search || undefined,
    });

    return res.json({
      data: result.list.map(toApiExam),
      exams: result.list.map(toApiExam),
      totalCount: result.total,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /exams/:id
 */
export async function getById(req, res, next) {
  try {
    const exam = await examRepository.findExamById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    return res.json(toApiExam(exam));
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /exams/:id
 * Update exam. Only Admin, Registrar.
 */
export async function update(req, res, next) {
  try {
    const parsed = safeParseUpdateExam(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const exam = await examService.updateExam(req.params.id, parsed.data);
    return res.json(toApiExam(exam));
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ message: err.message });
    }
    if (err.code === 'VALIDATION' || err.code === 'DUPLICATE') {
      return res.status(400).json({ message: err.message });
    }
    if (err?.code === 'P2025') {
      return res.status(404).json({ message: 'Exam not found' });
    }
    if (err?.code === 'P2002') {
      return res.status(409).json({
        message: 'An exam with the same class, subject, and name already exists.',
      });
    }
    next(err);
  }
}

/**
 * DELETE /exams/:id
 * Delete exam. Only Admin, Registrar.
 */
export async function remove(req, res, next) {
  try {
    const existing = await examRepository.findExamById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    await examRepository.deleteExam(req.params.id);
    return res.status(204).send();
  } catch (err) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ message: 'Exam not found' });
    }
    next(err);
  }
}
