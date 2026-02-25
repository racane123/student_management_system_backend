/**
 * backend/src/modules/exams/exam.validation.js
 * Zod schema for exam create/update payload.
 */

import { z } from 'zod';

export const createExamSchema = z
  .object({
    name: z.string().min(1, 'Exam name is required').max(200),
    classId: z.coerce.number().int().positive('Class is required'),
    subjectId: z.coerce.number().int().positive('Subject is required'),
    examDate: z.string().min(1, 'Exam date is required').regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    startTime: z.string().min(1, 'Start time is required').max(10),
    endTime: z.string().min(1, 'End time is required').max(10),
    totalMarks: z.coerce.number().int().min(1).default(100),
    passingMarks: z.coerce.number().int().min(0).default(40),
    status: z.enum(['Scheduled', 'Ongoing', 'Completed']).default('Scheduled'),
  })
  .refine((data) => data.passingMarks <= data.totalMarks, {
    message: 'Passing marks cannot exceed total marks',
    path: ['passingMarks'],
  });

export const updateExamSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  classId: z.coerce.number().int().positive().optional(),
  subjectId: z.coerce.number().int().positive().optional(),
  examDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional(),
  startTime: z.string().max(10).optional(),
  endTime: z.string().max(10).optional(),
  totalMarks: z.coerce.number().int().min(1).optional(),
  passingMarks: z.coerce.number().int().min(0).optional(),
  status: z.enum(['Scheduled', 'Ongoing', 'Completed']).optional(),
});

export function safeParseCreateExam(data) {
  return createExamSchema.safeParse(data);
}

export function safeParseUpdateExam(data) {
  return updateExamSchema.safeParse(data);
}
