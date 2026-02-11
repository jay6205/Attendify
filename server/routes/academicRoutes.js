
import express from 'express';
import { getAllSemesters, getAllCourses, getCourseById } from '../controllers/academicController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base: /api/v2/academic
router.use(protect);

router.get('/semesters', getAllSemesters);
router.get('/courses', getAllCourses);
router.get('/courses/:id', getCourseById);

export default router;
