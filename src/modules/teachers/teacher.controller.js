// backend/src/modules/teachers/teacher.controller.js
// Request/Response handling for teacher registration.

import { safeParseRegisterTeacher } from './teacher.validation.js';
import * as teacherService from './teacher.service.js';

/**
 * POST /teachers/register
 * Create teacher (user + teacher profile) in one transaction.
 */
export async function register(req, res, next) {
  try {
    const parsed = safeParseRegisterTeacher(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const payload = parsed.data;
    const { user, teacher } = await teacherService.registerTeacher(payload);

    return res.status(201).json({
      message: 'Teacher registered successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        teacher: {
          id: teacher.id,
          first_name: teacher.first_name,
          last_name: teacher.last_name,
          email: teacher.email,
          status: teacher.status,
        },
      },
    });
  } catch (err) {
    const code = err?.code;
    if (code === 'USER_EXISTS') {
      return res.status(409).json({ message: err.message });
    }
    if (err?.code === 'P2002') {
      return res.status(409).json({
        message: 'User or teacher already exists with this username or email.',
      });
    }
    next(err);
  }
}

