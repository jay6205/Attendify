import express from 'express';
import { getMyAlerts, markAlertRead, markAllRead } from '../controllers/alertController.js';
import { protect } from '../middleware/authMiddleware.js';
import { attachOrganizationScope } from '../middleware/scopeMiddleware.js';

const router = express.Router();

// Base: /api/v2/alerts
router.use(protect);
router.use(attachOrganizationScope);

router.get('/my', getMyAlerts);
router.put('/read-all', markAllRead);
router.put('/:alertId/read', markAlertRead);

export default router;
