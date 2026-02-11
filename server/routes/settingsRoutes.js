import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = express.Router();

router.route('/')
    .get(protect, getSettings)
    .put(protect, updateSettings);

export default router;
