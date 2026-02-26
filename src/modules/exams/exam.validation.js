/**
 * backend/src/modules/exams/exam.validation.js
 * Zod schema for exam create/update payload.
 * Grading: total_marks (positive integer), passing_marks <= total_marks for Results Module pass/fail.
 */

import { z } from 'zod';

const totalMarksSchema = z.coerce.number().int().positive('total_marks must be a positive integer (e.g. 50, 100)');
const passingMarksSchema = z.coerce.number().int().min(0, 'passing_marks must be 0 or greater');

export const createExamSchema = z
  .object({
    name: z.string().min(1, 'Exam name is required').max(200),
    classId: z.coerce.number().int().positive('Class is required'),
    subjectId: z.coerce.number().int().positive('Subject is required'),
    examDate: z.string().min(1, 'Exam date is required').regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    startTime: z.string().min(1, 'Start time is required').max(10),
    endTime: z.string().min(1, 'End time is required').max(10),
    totalMarks: totalMarksSchema.default(100),
    passingMarks: passingMarksSchema.default(40),
    status: z.enum(['PENDING', 'ONGOING', 'COMPLETED']).default('PENDING'),
  })
  .refine((data) => data.passingMarks <= data.totalMarks, {
    message: 'passing_marks cannot exceed total_marks',
    path: ['passingMarks'],
  });

export const updateExamSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    classId: z.coerce.number().int().positive().optional(),
    subjectId: z.coerce.number().int().positive().optional(),
    examDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
      .optional(),
    startTime: z.string().max(10).optional(),
    endTime: z.string().max(10).optional(),
    totalMarks: totalMarksSchema.optional(),
    passingMarks: passingMarksSchema.optional(),
    status: z.enum(['PENDING', 'ONGOING', 'COMPLETED']).optional(),
  })
  .refine((data) => (data.passingMarks == null || data.totalMarks == null || data.passingMarks <= data.totalMarks), {
    message: 'passing_marks cannot exceed total_marks',
    path: ['passingMarks'],
  });

export function safeParseCreateExam(data) {
  return createExamSchema.safeParse(data);
}

export function safeParseUpdateExam(data) {
  return updateExamSchema.safeParse(data);
}
