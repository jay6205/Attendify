import express from 'express';
import { startSession, submitAnswer, getActiveSession, getSessionStats, stopSession } from '../controllers/aiAttendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base: /api/v2/attendance/ai
router.use(protect);

router.post('/session/start', protect, authorize('teacher'), startSession);
router.post('/session/stop', protect, authorize('teacher'), stopSession); // Added stop route
router.post('/session/submit', protect, authorize('student'), submitAnswer); // Validated inside controller for Student
router.get('/session/active/:courseId', getActiveSession);
router.get('/session/:sessionId/stats', getSessionStats);

export default router;
