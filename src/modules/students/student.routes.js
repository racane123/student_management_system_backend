/**
 * backend/src/modules/students/student.routes.js
 */

import { Router } from 'express';
import * as studentController from './student.controller.js';

const router = Router();

router.post('/register', studentController.register);
router.get('/', studentController.list);
router.get('/:id', studentController.getById);
router.patch('/:id', studentController.update);
router.delete('/:id', studentController.remove);

export default router;
