/**
 * backend/src/modules/students/student.routes.js
 */

import { Router } from 'express';
import { validate } from '../../core/middlewares/validate.js';
import { createStudentSchema, updateStudentSchema } from './student.validation.js';
import * as studentController from './student.controller.js';

const router = Router();

router.post('/register', studentController.register);
router.post('/', validate(createStudentSchema, 'body'), studentController.create);
router.get('/', studentController.list);
router.get('/:id', studentController.getById);
router.patch('/:id', validate(updateStudentSchema, 'body'), studentController.update);
router.delete('/:id', studentController.remove);

export default router;
