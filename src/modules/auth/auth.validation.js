/**
 * Auth validation – login payload (Zod).
 * backend/src/modules/auth/auth.validation.js
 */

import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const validateLogin = (data) => loginSchema.parse(data);
export const safeParseLogin = (data) => loginSchema.safeParse(data);
