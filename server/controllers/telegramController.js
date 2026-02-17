import User from '../models/User.js';

// @desc    Link Telegram account by saving chatId
// @route   POST /api/v2/telegram/link
// @access  Private
export const linkTelegram = async (req, res) => {
    try {
        const { chatId } = req.body;

        if (!chatId || typeof chatId !== 'string' || !chatId.trim()) {
            return res.status(400).json({ message: 'A valid Telegram chatId is required' });
        }

        const sanitizedChatId = chatId.trim();

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
        // Always respond 200 to Telegram immediately
        res.sendStatus(200);

        const { sendTelegramMessage } = await import('../services/telegram.service.js');

        const message = req.body?.message;
        if (!message?.text) return;

        const chatId = String(message.chat.id);
        const text = message.text.trim();
        const firstName = message.from?.first_name || 'there';

        if (text === '/start') {
            const reply =
                `👋 Hi ${firstName}! Welcome to Attendify Alerts.\n\n` +
                `Your Chat ID is:\n\n` +
                `<code>${chatId}</code>\n\n` +
                `📋 Copy this ID and paste it in your Attendify Settings page to link your account.`;

            await sendTelegramMessage(chatId, reply);
            console.log(`[Webhook] Sent chat ID ${chatId} to ${firstName}`);
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

        if (!token) {
            return res.status(500).json({ message: 'TELEGRAM_BOT_TOKEN not set' });
        }
        if (!backendUrl) {
            return res.status(500).json({ message: 'BACKEND_URL not set in env' });
        }

        const webhookUrl = `${backendUrl}/api/v2/telegram/webhook`;

        const response = await axios.post(
            `https://api.telegram.org/bot${token}/setWebhook`,
            { url: webhookUrl }
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

