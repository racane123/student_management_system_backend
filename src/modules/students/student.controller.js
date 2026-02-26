/**
 * backend/src/modules/students/student.controller.js
 * Handles request/response for student registration.
 * Catches transaction errors: User already exists, duplicate email/username, database timeout.
 */

import { safeParseRegisterStudent } from './student.validation.js';
import * as studentService from './student.service.js';
import * as studentRepository from './student.repository.js';

function toApiStudent(student) {
  if (!student) return null;
  return {
    id: student.id,
    admissionNo: student.admission_no,
    firstName: student.first_name,
    lastName: student.last_name,
    gender: student.gender,
    dob: student.date_of_birth,
    email: student.email,
    phone: student.phone,
    address: student.address,
    classId: student.class_id,
    guardianName: student.guardian_name,
    guardianPhone: student.guardian_phone,
    profileImage: student.profile_image,
    status: student.status,
    createdAt: student.created_at,
    updatedAt: student.updated_at,
  };
}

/**
 * POST /students/register
 * Create student (user + student profile + student_accounts) in one transaction.
 */
export async function register(req, res, next) {
  try {
    const parsed = safeParseRegisterStudent(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const payload = parsed.data;
    const { user, student, student_account } = await studentService.registerStudent(payload);

    return res.status(201).json({
      message: 'Student registered successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        student: {
          id: student.id,
          admission_no: student.admission_no,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          phone: student.phone,
          status: student.status,
        },
        student_account: {
          id: student_account.id,
          user_id: student_account.user_id,
          student_id: student_account.student_id,
        },
      },
    });
  } catch (err) {
    const code = err?.code;
    if (code === 'USER_EXISTS') {
      return res.status(409).json({ message: err.message });
    }
    if (code === 'P2002') {
      const target = err.meta?.target || [];
      if (Array.isArray(target) && target.some((t) => String(t).includes('admission_no'))) {
        return res.status(409).json({ message: 'Admission number already exists.' });
      }
      return res.status(409).json({
        message: 'User already exists with this username or email.',
      });
    }
    if (code === 'P2024') {
      return res.status(504).json({
        message: 'Database timeout. Please try again.',
      });
    }
    next(err);
  }
}

/**
 * POST /students
 * Plain create (student profile only, no user account). Body validated by validate(createStudentSchema).
 */
export async function create(req, res, next) {
  try {
    const data = req.body;
    const payload = {
      admission_no: data.admission_no,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: data.gender ?? null,
      date_of_birth: data.date_of_birth ?? null,
      email: data.email ?? null,
      phone: data.phone || null,
      address: data.address ?? null,
      class_id: data.class_id ?? null,
      guardian_name: data.guardian_name ?? null,
      guardian_phone: data.guardian_phone || null,
      profile_image: data.profile_image ?? null,
      status: data.status ?? 'active',
    };
    const student = await studentRepository.createStudent(payload);
    return res.status(201).json(toApiStudent(student));
  } catch (err) {
    if (err?.code === 'P2002') {
      const target = err.meta?.target || [];
      if (Array.isArray(target) && target.includes('admission_no')) {
        return res.status(409).json({ message: 'Admission number already exists.' });
      }
    }
    next(err);
  }
}

/**
 * GET /students
 * List students with optional filters (classId, status, search) and pagination.
 */
export async function list(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await studentService.getStudents(req.query);
    return res.json({
      data: result.list.map(toApiStudent),
      totalCount: result.total,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /students/:id
 */
export async function getById(req, res, next) {
  try {
    const student = await studentRepository.findStudentById(req.params.id, {
      include: { student_accounts: { include: { user: true } } },
    });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    return res.json(toApiStudent(student));
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /students/:id
 * Body validated by validate(updateStudentSchema).
 */
export async function update(req, res, next) {
  try {
    const student = await studentRepository.updateStudent(req.params.id, req.body);
    return res.json(toApiStudent(student));
  } catch (err) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ message: 'Student not found' });
    }
    if (err?.code === 'P2002') {
      const target = err.meta?.target || [];
      if (Array.isArray(target) && target.includes('admission_no')) {
        return res.status(409).json({ message: 'Admission number already exists.' });
      }
    }
    next(err);
  }
}

/**
 * DELETE /students/:id
 */
export async function remove(req, res, next) {
  try {
    await studentRepository.deleteStudent(req.params.id);
    return res.status(204).send();
  } catch (err) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ message: 'Student not found' });
    }
    next(err);
  }
}
