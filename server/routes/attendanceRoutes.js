import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getAttendanceSummary,
    logAttendance,
    quickUpdate,
    getLogs,
    deleteLog
} from '../controllers/attendanceController.js';

const router = express.Router();

router.get('/', protect, getAttendanceSummary);
router.post('/logs/:subjectId', protect, logAttendance);
router.get('/logs/:subjectId', protect, getLogs);
router.put('/update/:subjectId', protect, quickUpdate);
router.delete('/logs/:logId', protect, deleteLog);

export default router;
