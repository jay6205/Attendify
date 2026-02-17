import crypto from 'crypto';
import User from '../models/User.js';

// ─── Utility ───────────────────────────────────────────────────────────────────

const escapeHtml = (str) => {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
};

// @desc    Link Telegram account by saving chatId
// @route   POST /api/v2/telegram/link
// @access  Private
export const linkTelegram = async (req, res) => {
    try {
        const { chatId } = req.body;

        // Coerce to string (supports numeric input from frontend)
        const sanitizedChatId = String(chatId ?? '').trim();

        // Validate: must be a Telegram numeric chat ID (optional leading '-' for groups)
        if (!sanitizedChatId || !/^-?\d+$/.test(sanitizedChatId)) {
            return res.status(400).json({ message: 'A valid numeric Telegram Chat ID is required' });
        }

        // Check if chatId is already linked to another account
        const existingUser = await User.findOne({
            telegramChatId: sanitizedChatId,
            _id: { $ne: req.user._id }
        });
        if (existingUser) {
            return res.status(409).json({ message: 'This Telegram account is already linked to another user' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { telegramChatId: sanitizedChatId, telegramLinked: true },
            { new: true }
        ).select('telegramChatId telegramLinked');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Telegram linked successfully',
            telegramLinked: user.telegramLinked,
            telegramChatId: user.telegramChatId
        });
    } catch (error) {
        // Handle duplicate key from unique index on telegramChatId
        if (error.code === 11000) {
            return res.status(409).json({ message: 'This Telegram account is already linked to another user' });
        }
        console.error('Link Telegram Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Unlink Telegram account
// @route   DELETE /api/v2/telegram/link
// @access  Private
export const unlinkTelegram = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { telegramChatId: null, telegramLinked: false },
            { new: true }
        ).select('telegramChatId telegramLinked');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Telegram unlinked successfully',
            telegramLinked: false,
            telegramChatId: null
        });
    } catch (error) {
        console.error('Unlink Telegram Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Telegram linking status
// @route   GET /api/v2/telegram/status
// @access  Private
export const getTelegramStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('telegramChatId telegramLinked');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            telegramLinked: user.telegramLinked || false,
            telegramChatId: user.telegramLinked ? user.telegramChatId : null
        });
    } catch (error) {
        console.error('Telegram Status Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ─── Production Webhook ────────────────────────────────────────────────────────

// @desc    Telegram webhook handler — receives updates from Telegram
// @route   POST /api/v2/telegram/webhook
// @access  Public (called by Telegram servers — NO auth)
export const handleWebhook = async (req, res) => {
    try {
        // Validate webhook secret if configured
        const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
        if (webhookSecret) {
            const headerSecret = req.headers['x-telegram-bot-api-secret-token'];
            if (!headerSecret || Buffer.byteLength(headerSecret) !== Buffer.byteLength(webhookSecret) ||
                !crypto.timingSafeEqual(Buffer.from(headerSecret, 'utf8'), Buffer.from(webhookSecret, 'utf8'))) {
                console.warn('[Webhook] Unauthorized attempt — invalid or missing secret token');
                return res.sendStatus(403);
            }
        }

        // Always respond 200 to Telegram immediately
        res.sendStatus(200);

        const { sendTelegramMessage } = await import('../services/telegram.service.js');

        const message = req.body?.message;
        if (!message?.text || !message?.chat?.id) return;

        const chatId = String(message.chat.id);
        const text = message.text.trim();
        const rawFirstName = message.from?.first_name || 'there';
        const firstName = escapeHtml(rawFirstName);

        if (text === '/start') {
            const reply =
                `👋 Hi ${firstName}! Welcome to Attendify Alerts.\n\n` +
                `Your Chat ID is:\n\n` +
                `<code>${chatId}</code>\n\n` +
                `📋 Copy this ID and paste it in your Attendify Settings page to link your account.`;

            await sendTelegramMessage(chatId, reply);
            console.log(`[Webhook] Sent chat ID to ${chatId}`);
        } else {
            await sendTelegramMessage(chatId, 'ℹ️ I only send alerts from Attendify.\n\nUse /start to get your Chat ID.');
        }
    } catch (error) {
        console.error('Telegram Webhook Error:', error.message);
    }
};

// @desc    Register webhook URL with Telegram (call once after deploying)
// @route   POST /api/v2/telegram/register-webhook
// @access  Private
export const registerWebhook = async (req, res) => {
    try {
        const axios = (await import('axios')).default;
        const backendUrl = process.env.BACKEND_URL;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

        if (!token) {
            return res.status(500).json({ message: 'TELEGRAM_BOT_TOKEN not set' });
        }
        if (!backendUrl) {
            return res.status(500).json({ message: 'BACKEND_URL not set in env' });
        }

        const webhookUrl = `${backendUrl}/api/v2/telegram/webhook`;

        const payload = { url: webhookUrl };
        // Set secret_token so Telegram sends it in the X-Telegram-Bot-Api-Secret-Token header
        if (webhookSecret) {
            payload.secret_token = webhookSecret;
        }

        const response = await axios.post(
            `https://api.telegram.org/bot${token}/setWebhook`,
            payload
        );

        console.log('[Telegram] Webhook registered:', webhookUrl, response.data);
        res.json({
            message: 'Webhook registered',
            webhookUrl,
            result: response.data
        });
    } catch (error) {
        console.error('Register Webhook Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to register webhook' });
    }
};
