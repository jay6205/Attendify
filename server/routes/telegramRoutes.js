import express from 'express';
import { linkTelegram, unlinkTelegram, getTelegramStatus, handleWebhook, registerWebhook } from '../controllers/telegramController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base: /api/v2/telegram

// ── Public (no auth) — called by Telegram servers ──
router.post('/webhook', handleWebhook);

// ── Protected — require auth ──
router.use(protect);

router.get('/status', getTelegramStatus);
router.post('/link', linkTelegram);
router.delete('/link', unlinkTelegram);
router.post('/register-webhook', registerWebhook);

export default router;
