// backend/src/modules/classes/class.controller.js
import express from 'express';
import { validate } from '../../core/middlewares/validate.js';
import {
  bulkAssignSubjectsSchema,
  assignTeacherSchema,
} from './class.validation.js';
import { getAllClasses } from './class.repository.js';
import { bulkAssignSubjects, assignTeacherToSubject } from './class.service.js';

const router = express.Router();

// GET /classes – full class profile
router.get('/', async (_req, res, next) => {
  try {
    const classes = await getAllClasses();
    res.json(classes);
  } catch (err) {
    next(err);
  }
});

// POST /classes/:id/subjects/bulk
router.post(
  '/:id/subjects/bulk',
  validate(bulkAssignSubjectsSchema, 'body'),
  async (req, res, next) => {
    try {
      const result = await bulkAssignSubjects({
        class_id: req.params.id,
        subject_ids: req.body.subject_ids,
      });
      res.status(200).json(result);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ message: err.message });
      }
      if (err.code === 'VALIDATION' || err.code === 'DUPLICATE_SUBJECTS') {
        return res.status(400).json({ message: err.message });
      }
      if (err.code === 'P2002') {
        return res.status(400).json({ message: 'Duplicate class-subject assignment' });
      }
      next(err);
    }
  }
);

// POST /classes/assign-teacher
router.post(
  '/assign-teacher',
  validate(assignTeacherSchema, 'body'),
  async (req, res, next) => {
    try {
      const mapping = await assignTeacherToSubject(req.body);
      res.status(201).json(mapping);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ message: err.message });
      }
      if (err.code === 'SUBJECT_NOT_IN_CLASS') {
        return res.status(400).json({ message: err.message });
      }
      if (err.code === 'DUPLICATE_ASSIGNMENT') {
        return res.status(400).json({ message: err.message });
      }
      if (err.code === 'P2002') {
        return res
          .status(400)
          .json({ message: 'Teacher already assigned to this subject in this class' });
      }
      next(err);
    }
  }
);

export default router;

