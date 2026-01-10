import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getSubjects,
    addSubject,
    updateSubject,
    deleteSubject
} from '../controllers/subjectController.js';

const router = express.Router();

router.route('/')
    .get(protect, getSubjects)
    .post(protect, addSubject);

router.route('/:id')
    .put(protect, updateSubject)
    .delete(protect, deleteSubject);

export default router;
