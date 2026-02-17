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

if (!TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not set in .env');
    process.exit(1);
}

const API = `https://api.telegram.org/bot${TOKEN}`;
let offset = 0;

async function getUpdates() {
    try {
        const res = await axios.get(`${API}/getUpdates`, {
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
    } catch (error) {
        // Ignore timeout errors, log others
        if (error.code !== 'ETIMEDOUT') {
            console.error('[Bot] Poll error:', error.message);
        }
    }
}

async function handleUpdate(update) {
    const message = update?.message;
    if (!message?.text) return;

    const chatId = message.chat.id;
    const text = message.text.trim();
    const firstName = message.from?.first_name || 'there';

    if (text === '/start') {
        const reply =
            `👋 Hi ${firstName}! Welcome to Attendify Alerts.\n\n` +
            `Your Chat ID is:\n\n` +
            `<code>${chatId}</code>\n\n` +
            `📋 Copy this ID and paste it in your Attendify Settings page to link your account.`;

        await sendMessage(chatId, reply);
        console.log(`[Bot] Sent chat ID ${chatId} to ${firstName}`);
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

console.log('🤖 Attendify Telegram Bot started (polling mode)');
console.log('   Waiting for messages...\n');

// First, remove any existing webhook so polling works
async function clearWebhook() {
    try {
        await axios.post(`${API}/deleteWebhook`);
        console.log('   ✓ Webhook cleared (polling mode active)\n');
    } catch (e) {
        console.warn('   ⚠ Could not clear webhook:', e.message);
    }
}

async function start() {
    await clearWebhook();
    // eslint-disable-next-line no-constant-condition
    while (true) {
        await getUpdates();
    }
}

start();
