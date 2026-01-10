import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getSettings, updateSettings, resetData } from '../controllers/settingsController.js';

const router = express.Router();

router.route('/')
    .get(protect, getSettings)
    .put(protect, updateSettings);

router.post('/reset', protect, resetData);

export default router;
