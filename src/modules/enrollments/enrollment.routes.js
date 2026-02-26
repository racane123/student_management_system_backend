// backend/src/modules/enrollments/enrollment.routes.js

import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { permissionMiddleware } from '../../core/middlewares/permissionMiddleware.js';
import { validate } from '../../core/middlewares/validate.js';
import { bulkEnrollSchema, transferSchema } from './enrollment.validation.js';
import { bulkEnroll, list, history, transfer } from './enrollment.controller.js';

const router = Router();

router.use(authMiddleware);

router.post(
  '/bulk',
  permissionMiddleware(['CREATE_STUDENT'], { mode: 'OR' }),
  validate(bulkEnrollSchema, 'body'),
  bulkEnroll
);

router.get(
  '/',
  permissionMiddleware(['VIEW_STUDENT'], { mode: 'OR' }),
  list
);

router.get(
  '/student/:student_id/history',
  permissionMiddleware(['VIEW_STUDENT'], { mode: 'OR' }),
  history
);

router.post(
  '/transfer',
  permissionMiddleware(['CREATE_STUDENT'], { mode: 'OR' }),
  validate(transferSchema, 'body'),
  transfer
);

export default router;

