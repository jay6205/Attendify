
import express from 'express';
import { markAttendance, getAttendance } from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base: /api/v2/attendance
router.use(protect);

router.post('/mark', markAttendance); // Teacher only
router.get('/course/:courseId', getAttendance); // Teacher (all), Student (own)

export default router;
