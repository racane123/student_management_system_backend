// backend/src/modules/enrollments/enrollment.validation.js

import { z } from 'zod';

export const academicYearSchema = z
  .string()
  .regex(/^\d{4}-\d{4}$/, 'academic_year must be in format YYYY-YYYY')
  .refine((val) => {
    const [start, end] = val.split('-').map(Number);
    return end === start + 1;
  }, 'academic_year end year must be start year + 1');

export const bulkEnrollSchema = z.object({
  student_ids: z
    .array(z.coerce.number().int().positive())
    .nonempty('student_ids cannot be empty'),
  class_id: z.coerce.number().int().positive(),
  academic_year: academicYearSchema,
});

export const transferSchema = z.object({
  student_id: z.coerce.number().int().positive(),
  from_class_id: z.coerce.number().int().positive(),
  to_class_id: z.coerce.number().int().positive(),
  academic_year: academicYearSchema,
});

