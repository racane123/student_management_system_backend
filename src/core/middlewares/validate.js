/**
 * Generic Zod validation middleware.
 * Usage: router.post('/path', validate(schema, 'body'), handler)
 */

import { ZodSchema } from 'zod';

/**
 * @param {ZodSchema} schema
 * @param {'body'|'query'|'params'} part
 */
export function validate(schema, part = 'body') {
  return (req, res, next) => {
    const data = req[part];
    const result = schema.safeParse(data);
    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }
    req[part] = result.data;
    next();
  };
}

