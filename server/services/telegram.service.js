import axios from 'axios';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// ─── Core Sender ───────────────────────────────────────────────────────────────

/**
 * Send a message to a Telegram chat. Never throws — errors are logged only.
 * @param {string} chatId  - Telegram chat ID
 * @param {string} message - Text message (supports Telegram HTML or plain text)
 */
export const sendTelegramMessage = async (chatId, message) => {
    try {
        if (!process.env.TELEGRAM_BOT_TOKEN) {
            console.warn('[TelegramService] TELEGRAM_BOT_TOKEN not set — skipping send');
            return;
        }

        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });
    } catch (error) {
        // Log but never propagate — alert creation must not fail
        const desc = error.response?.data?.description || error.message;
        console.error(`[TelegramService] Failed to send message to ${chatId}: ${desc}`);
    }
};

// ─── Message Formatters ────────────────────────────────────────────────────────

export const formatAbsentMessage = (courseName, date, startTime, endTime) => {
    let dateStr;
    if (date instanceof Date) {
        dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (date) {
        const parsed = new Date(date);
        dateStr = isNaN(parsed.getTime())
            ? new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } else {
        dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const timeSlot = startTime && endTime ? ` (${startTime} – ${endTime})` : '';
    return `🚨 <b>Attendance Alert</b>\nYou were marked <b>ABSENT</b> in <b>${courseName}</b> on ${dateStr}${timeSlot}.`;
};

export const formatMarksMessage = (courseName, assessmentName, scored, total) => {
    return `📊 <b>Marks Update</b>\nYou scored <b>${scored} / ${total}</b> in <b>${courseName}</b> — ${assessmentName}.`;
};

export const formatLowAttendanceMessage = (courseName, percentage) => {
    return `⚠️ <b>Low Attendance Warning</b>\nYour attendance in <b>${courseName}</b> is at <b>${percentage}%</b>. Please attend classes regularly.`;
};

export const formatGenericMessage = (title, message) => {
    return `📢 <b>${title}</b>\n${message}`;
};

// ─── Type-Based Formatter ──────────────────────────────────────────────────────

/**
 * Build a Telegram-ready message string from alert type + metadata.
 */
export const buildTelegramMessage = (type, title, message, metadata) => {
    switch (type) {
        case 'ABSENT':
            return formatAbsentMessage(
                metadata?.courseName || title,
                metadata?.date,
                metadata?.startTime,
                metadata?.endTime
            );

        case 'MARKS_PUBLISHED':
            return formatMarksMessage(
                metadata?.courseName || 'Course',
                metadata?.assessmentName || title,
                metadata?.scored ?? '?',
                metadata?.total ?? '?'
            );

        case 'LOW_ATTENDANCE':
            return formatLowAttendanceMessage(
                metadata?.courseName || title,
                metadata?.percentage ?? '?'
            );

        default:
            return formatGenericMessage(title, message);
    }
};
