// backend/src/modules/classes/class.validation.js
import { z } from 'zod';

export const academicYearSchema = z
  .string()
  .regex(/^\d{4}-\d{4}$/, 'academic_year must be in format YYYY-YYYY')
  .refine((val) => {
    const [start, end] = val.split('-').map(Number);
    return end === start + 1;
  }, 'academic_year end year must be start year + 1');

const sectionSchema = z
  .string()
  .min(1, 'section is required')
  .max(20)
  .transform((v) => v.trim().toUpperCase());

export const createClassSchema = z.object({
  grade_level: z.string().min(1, 'grade_level is required'),
  section: sectionSchema,
  class_name: z.string().max(100).optional().nullable(),
  academic_year: academicYearSchema,
  adviser_id: z.coerce.number().int().positive().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export const updateClassSchema = createClassSchema.partial();

export const bulkAssignSubjectsSchema = z.object({
  class_id: z.coerce.number().int().positive(),
  subject_ids: z
    .array(z.coerce.number().int().positive())
    .min(1, 'At least one subject_id is required'),
});

export const assignTeacherSchema = z.object({
  teacher_id: z.coerce.number().int().positive(),
  class_id: z.coerce.number().int().positive(),
  subject_id: z.coerce.number().int().positive(),
});

