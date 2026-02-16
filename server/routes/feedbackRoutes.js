import express from 'express';
import {
    createFeedbackForm,
    getActiveFeedback,
    submitFeedback,
    getFeedbackSummary
} from '../controllers/feedbackController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { attachOrganizationScope } from '../middleware/scopeMiddleware.js';

const router = express.Router();

// Teacher/Admin: Create a feedback form
router.post(
    '/create',
    protect,
    authorize('teacher', 'admin'),
    attachOrganizationScope,
    createFeedbackForm
);

// Student: Get active (unsubmitted) feedback forms
router.get(
    '/active',
    protect,
    authorize('student'),
    attachOrganizationScope,
    getActiveFeedback
);

// Student: Submit feedback
router.post(
    '/submit',
    protect,
    authorize('student'),
    attachOrganizationScope,
    submitFeedback
);

// Teacher/Admin: Get aggregated summary for a course
router.get(
    '/summary/:courseId',
    protect,
    authorize('teacher', 'admin'),
    attachOrganizationScope,
    getFeedbackSummary
);

export default router;
