
import express from 'express';
import { getAllSemesters, getAllCourses } from '../controllers/academicController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base: /api/v2/academic
router.use(protect);

router.get('/semesters', getAllSemesters);
router.get('/courses', getAllCourses);

export default router;
