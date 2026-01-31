
import express from 'express';
import {
    submitLeaveRequest,
    getLeaveRequests,
    handleLeaveRequest
} from '../controllers/leaveController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base: /api/v2/leaves
router.use(protect);

router.post('/', submitLeaveRequest); // Student only
router.get('/', getLeaveRequests);    // Teacher (course related), Student (own)
router.put('/:id', handleLeaveRequest); // Teacher only

export default router;
