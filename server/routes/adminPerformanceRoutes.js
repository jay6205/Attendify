
import express from 'express';
import {
    getInstitutePerformance,
    getCoursePerformance,
    getStudentPerformance
} from '../controllers/adminPerformanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base: /api/v2/admin/performance
router.use(protect);
router.use(authorize('admin'));

router.get('/institute', getInstitutePerformance);
router.get('/courses/:courseId', getCoursePerformance);
router.get('/students/:studentId', getStudentPerformance);

export default router;
