// backend/src/modules/teachers/teacher.validation.js
// Zod schema for teacher registration payload.

import { z } from 'zod';

const phoneRegex = /^\+?[\d\s-]{10,20}$/;

export const registerTeacherSchema = z
  .object({
    username: z
      .string()
      .min(2, 'Username must be at least 2 characters')
      .max(50)
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, and . _ -'),
    email: z.string().email('Invalid email address').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),

    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().min(1, 'Last name is required').max(100),
    phone: z
      .string()
      .max(20)
      .regex(phoneRegex, 'Invalid phone number format')
      .optional()
      .nullable()
      .or(z.literal('')),
    status: z.enum(['active', 'inactive']).optional().default('active'),
  })
  .strict();

export function safeParseRegisterTeacher(data) {
  return registerTeacherSchema.safeParse(data);
}

