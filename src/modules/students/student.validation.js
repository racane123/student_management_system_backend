/**
 * backend/src/modules/students/student.validation.js
 * Strict Zod schema for student registration payload.
 * Validates email, phone, date of birth, and required fields.
 */

import { z } from 'zod';

const phoneRegex = /^\+?[\d\s-]{10,20}$/;

export const registerStudentSchema = z
  .object({
    // Credentials
    username: z
      .string()
      .min(2, 'Username must be at least 2 characters')
      .max(50)
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, and . _ -'),
    email: z.string().email('Invalid email address').max(255),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128),

    // Profile (snake_case to match schema)
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().min(1, 'Last name is required').max(100),
    gender: z.enum(['male', 'female', 'other']).optional().nullable(),
    date_of_birth: z
      .union([
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
        z.date(),
        z.null(),
        z.undefined(),
      ])
      .optional()
      .nullable()
      .transform((val) => {
        if (val == null || val === '') return null;
        return val instanceof Date ? val : new Date(val);
      }),
    phone: z
      .string()
      .max(20)
      .regex(phoneRegex, 'Invalid phone number format')
      .optional()
      .nullable()
      .or(z.literal('')),
    address: z.string().max(500).optional().nullable(),
    class_id: z.coerce.number().int().positive().optional().nullable(),
    guardian_name: z.string().max(150).optional().nullable(),
    guardian_phone: z
      .string()
      .max(20)
      .regex(phoneRegex, 'Invalid guardian phone format')
      .optional()
      .nullable()
      .or(z.literal('')),
    status: z
      .enum(['active', 'inactive', 'pending', 'suspended'])
      .optional()
      .default('active'),
  })
  .strict();

/**
 * Additional schemas for plain student CRUD (without user account).
 */

const admissionNoSchema = z
  .string()
  .regex(/^ST-\d{3}$/, 'Admission number must match pattern ST-000');

export const createStudentSchema = z
  .object({
    admission_no: admissionNoSchema,
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().min(1, 'Last name is required').max(100),
    gender: z.string().optional().nullable(),
    date_of_birth: z
      .union([
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
        z.date(),
        z.null(),
        z.undefined(),
      ])
      .optional()
      .nullable()
      .transform((val) => {
        if (val == null || val === '') return null;
        return val instanceof Date ? val : new Date(val);
      }),
    email: z.string().email('Invalid email address').max(255).optional().nullable(),
    phone: z
      .string()
      .max(20)
      .regex(phoneRegex, 'Invalid phone number format')
      .optional()
      .nullable()
      .or(z.literal('')),
    address: z.string().max(500).optional().nullable(),
    class_id: z.coerce.number().int().positive().optional().nullable(),
    guardian_name: z.string().max(150).optional().nullable(),
    guardian_phone: z
      .string()
      .max(20)
      .regex(phoneRegex, 'Invalid guardian phone format')
      .optional()
      .nullable()
      .or(z.literal('')),
    profile_image: z.string().url().optional().nullable(),
    status: z
      .enum(['active', 'inactive', 'pending', 'suspended'])
      .optional()
      .default('active'),
  })
  .strict();

export const updateStudentSchema = createStudentSchema.partial();

/**
 * Safe parse helpers.
 */
export function safeParseRegisterStudent(data) {
  return registerStudentSchema.safeParse(data);
}

export function safeParseCreateStudent(data) {
  return createStudentSchema.safeParse(data);
}

export function safeParseUpdateStudent(data) {
  return updateStudentSchema.safeParse(data);
}
