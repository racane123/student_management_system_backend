/**
 * Auth routes – login, refresh, logout.
 * backend/src/modules/auth/auth.routes.js
 */

import express from 'express';
import { login, refresh, logout, revokeAll, rolePermissions } from './auth.controller.js';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { roleMiddleware } from '../../core/middlewares/roleMiddleware.js';
import { permissionMiddleware } from '../../core/middlewares/permissionMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/revoke-all', authMiddleware, roleMiddleware([1, 2]), revokeAll);
router.get('/role-permissions', authMiddleware, permissionMiddleware(['VIEW_REPORT'], { mode: 'OR' }), rolePermissions);

export default router;
