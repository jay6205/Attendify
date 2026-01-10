import express from 'express';
const router = express.Router();
import { getSubjects, addSubject, updateSubject, deleteSubject } from '../controllers/subjectController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/')
    .get(protect, getSubjects)
    .post(protect, addSubject);

router.route('/:id')
    .put(protect, updateSubject)
    .delete(protect, deleteSubject);

export default router;
