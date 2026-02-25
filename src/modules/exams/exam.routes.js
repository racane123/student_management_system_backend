/**
 * backend/src/modules/exams/exam.routes.js
 * Routes protected by authMiddleware and roleMiddleware.
 * Create/Update/Delete: Admin, Registrar only.
 * List/Get: Admin, Registrar, Teacher.
 */

import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { roleMiddleware } from '../../core/middlewares/roleMiddleware.js';
import * as examController from './exam.controller.js';

const router = Router();

const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'REGISTRAR'];
const READ_ROLES = ['SUPER_ADMIN', 'ADMIN', 'REGISTRAR', 'TEACHER'];

router.use(authMiddleware);

router.get('/', roleMiddleware(READ_ROLES), examController.list);
router.get('/:id', roleMiddleware(READ_ROLES), examController.getById);

router.post('/', roleMiddleware(WRITE_ROLES), examController.create);
router.patch('/:id', roleMiddleware(WRITE_ROLES), examController.update);
router.delete('/:id', roleMiddleware(WRITE_ROLES), examController.remove);

export default router;
