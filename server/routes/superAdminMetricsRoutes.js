import express from 'express';
import { getOrganizationMetrics } from '../controllers/superAdminMetricsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are for Super Admin only
router.use(protect);
router.use(authorize('super_admin'));

router.get('/', getOrganizationMetrics);

export default router;
