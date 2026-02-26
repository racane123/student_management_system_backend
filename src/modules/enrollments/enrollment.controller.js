// backend/src/modules/enrollments/enrollment.controller.js

import { bulkEnrollStudents, transferStudent } from './enrollment.service.js';
import { findAllEnrollments, getStudentEnrollmentHistory } from './enrollment.repository.js';

export async function bulkEnroll(req, res, next) {
  try {
    const result = await bulkEnrollStudents(req.body);
    res.status(201).json({
      message: 'Bulk enrollment completed',
      ...result,
    });
  } catch (err) {
    if (err.code === 'CLASS_NOT_FOUND') {
      return res.status(404).json({ message: err.message });
    }
    if (err.code === 'STUDENT_NOT_FOUND') {
      return res.status(400).json({ message: err.message, invalidIds: err.meta?.invalidIds });
    }
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const { page, limit, academic_year, class_id } = req.query;
    const result = await findAllEnrollments({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      academic_year: academic_year || undefined,
      class_id: class_id || undefined,
    });
    res.json({
      data: result.list,
      totalCount: result.total,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  } catch (err) {
    next(err);
  }
}

export async function history(req, res, next) {
  try {
    const { student_id } = req.params;
    const list = await getStudentEnrollmentHistory(student_id);
    res.json({ data: list });
  } catch (err) {
    next(err);
  }
}

export async function transfer(req, res, next) {
  try {
    const result = await transferStudent(req.body);
    res.status(200).json({
      message: 'Student transferred successfully',
      ...result,
    });
  } catch (err) {
    if (err.code === 'ENROLLMENT_NOT_FOUND') {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
}

