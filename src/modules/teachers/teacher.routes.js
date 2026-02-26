// backend/src/modules/teachers/teacher.routes.js
import { Router } from 'express';
import * as teacherController from './teacher.controller.js';

const router = Router();

router.post('/register', teacherController.register);

export default router;

