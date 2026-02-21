/**
 * Telegram Bot Polling Script
 * 
 * Runs alongside the server to handle incoming Telegram messages.
 * When a user sends /start, the bot replies with their Chat ID
 * so they can paste it into the Attendify Settings page.
 * 
 * Usage: node scripts/telegramBot.js
 * 
 * Requires TELEGRAM_BOT_TOKEN in the .env file.
 */

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

let API;
if (TOKEN) {
    API = `https://api.telegram.org/bot${TOKEN}`;
} else {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN not set in .env. Bot will not start.');
}
let offset = 0;

// ─── Backoff for error retries ──────────────────────────────────────────────────
let retryDelay = 1000; // start at 1s
const MAX_RETRY_DELAY = 30000; // cap at 30s
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ─── HTML Escape ────────────────────────────────────────────────────────────────
const escapeHtml = (str) => {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
};

async function getUpdates() {
    try {
        const res = await axios.get(`${API}/getUpdates`, {
            timeout: 35000, // axios timeout slightly above Telegram's 30s long-poll
            params: {
                offset,
                timeout: 30, // long-poll for 30 seconds
                allowed_updates: ['message']
            }
        });

        const updates = res.data.result || [];

        for (const update of updates) {
            offset = update.update_id + 1;
            await handleUpdate(update);
        }

        // Reset backoff on success
        retryDelay = 1000;
    } catch (error) {
        // Ignore timeout errors, log others and back off
        if (error.code !== 'ETIMEDOUT') {
            console.error('[Bot] Poll error:', error.message);
            await sleep(retryDelay);
            retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
        }
    }
}

async function handleUpdate(update) {
    const message = update?.message;
    if (!message?.text) return;

    const chatId = message.chat.id;
    const text = message.text.trim();
    const rawFirstName = message.from?.first_name || 'there';
    const firstName = escapeHtml(rawFirstName);

    if (text === '/start') {
        const reply =
            `👋 Hi ${firstName}! Welcome to Attendify Alerts.\n\n` +
            `Your Chat ID is:\n\n` +
            `<code>${chatId}</code>\n\n` +
            `📋 Copy this ID and paste it in your Attendify Settings page to link your account.`;

        await sendMessage(chatId, reply);
        console.log(`[Bot] Sent chat ID ${chatId} to ${rawFirstName}`);
    } else {
        await sendMessage(chatId, 'ℹ️ I only send alerts from Attendify.\n\nUse /start to get your Chat ID.');
    }
}

async function sendMessage(chatId, text) {
    try {
        await axios.post(`${API}/sendMessage`, {
            chat_id: chatId,
            text,
            parse_mode: 'HTML'
        });
    } catch (error) {
        console.error(`[Bot] Failed to send to ${chatId}:`, error.response?.data?.description || error.message);
    }
}

// ─── Main Loop ─────────────────────────────────────────────────────────────────

// First, remove any existing webhook so polling works
async function clearWebhook() {
    try {
        await axios.post(`${API}/deleteWebhook`);
        console.log('   ✓ Webhook cleared (polling mode active)\n');
    } catch (e) {
        console.warn('   ⚠ Could not clear webhook:', e.message);
    }
}

export const startTelegramBot = async () => {
    if (!TOKEN) return; // Silent abort if no token in env

    console.log('🤖 Attendify Telegram Bot started (polling mode)');
    console.log('   Waiting for messages...\n');

    await clearWebhook();

    // Fire and forget polling loop
    (async () => {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            await getUpdates();
        }
    })();
};
