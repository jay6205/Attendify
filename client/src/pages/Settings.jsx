import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Shield, Lock, Send, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const Settings = () => {
    // Password Form
    const [passData, setPassData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [passMsg, setPassMsg] = useState({ type: '', text: '' });

    // Telegram State
    const [telegramStatus, setTelegramStatus] = useState({ telegramLinked: false, telegramChatId: null });
    const [chatIdInput, setChatIdInput] = useState('');
    const [telegramMsg, setTelegramMsg] = useState({ type: '', text: '' });
    const [telegramLoading, setTelegramLoading] = useState(true);
    const [telegramActionLoading, setTelegramActionLoading] = useState(false);

    // Fetch Telegram status on mount
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await api.get('/telegram/status');
                setTelegramStatus(res.data);
            } catch (error) {
                console.error('Failed to fetch Telegram status:', error);
            } finally {
                setTelegramLoading(false);
            }
        };
        fetchStatus();
    }, []);

    // ─── Password Handlers ─────────────────────────────────────────────

    const handlePassChange = (e) => {
        setPassData({ ...passData, [e.target.name]: e.target.value });
    };

    const submitPasswordChange = async (e) => {
        e.preventDefault();
        setPassMsg({ type: '', text: '' });

        if (passData.newPassword !== passData.confirmPassword) {
            setPassMsg({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        try {
            await api.put('/auth/password', { 
                oldPassword: passData.oldPassword, 
                newPassword: passData.newPassword 
            });
            setPassMsg({ type: 'success', text: 'Password changed successfully' });
            setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setPassMsg({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
        }
    };

    // ─── Telegram Handlers ─────────────────────────────────────────────

    const linkTelegram = async () => {
        setTelegramMsg({ type: '', text: '' });
        const trimmed = chatIdInput.trim();

        if (!trimmed) {
            setTelegramMsg({ type: 'error', text: 'Please enter your Telegram Chat ID' });
            return;
        }

        setTelegramActionLoading(true);
        try {
            const res = await api.post('/telegram/link', { chatId: trimmed });
            setTelegramStatus({ telegramLinked: true, telegramChatId: res.data.telegramChatId });
            setChatIdInput('');
            setTelegramMsg({ type: 'success', text: 'Telegram linked successfully! You will now receive alerts.' });
        } catch (error) {
            setTelegramMsg({ type: 'error', text: error.response?.data?.message || 'Failed to link Telegram' });
        } finally {
            setTelegramActionLoading(false);
        }
    };

    const unlinkTelegram = async () => {
        setTelegramMsg({ type: '', text: '' });
        setTelegramActionLoading(true);
        try {
            await api.delete('/telegram/link');
            setTelegramStatus({ telegramLinked: false, telegramChatId: null });
            setTelegramMsg({ type: 'success', text: 'Telegram disconnected' });
        } catch (error) {
            setTelegramMsg({ type: 'error', text: error.response?.data?.message || 'Failed to unlink Telegram' });
        } finally {
            setTelegramActionLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>

            {/* Section: Security */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                    <Shield className="text-indigo-400" size={24} />
                    <h2 className="text-xl font-bold text-slate-100">Security</h2>
                </div>

                <form onSubmit={submitPasswordChange} className="space-y-4">
                    {passMsg.text && (
                        <div className={`p-3 rounded-lg text-sm ${passMsg.type === 'error' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {passMsg.text}
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Current Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-slate-600" size={16} />
                            <input 
                                type="password" 
                                name="oldPassword"
                                value={passData.oldPassword}
                                onChange={handlePassChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">New Password</label>
                            <input 
                                type="password" 
                                name="newPassword"
                                value={passData.newPassword}
                                onChange={handlePassChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                placeholder="New Password"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Confirm New</label>
                            <input 
                                type="password" 
                                name="confirmPassword"
                                value={passData.confirmPassword}
                                onChange={handlePassChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                placeholder="Confirm"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Update Password
                    </button>
                </form>
            </div>

            {/* Section: Telegram Notifications */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                    <Send className="text-sky-400" size={24} />
                    <h2 className="text-xl font-bold text-slate-100">Telegram Notifications</h2>
                </div>

                <p className="text-sm text-slate-400 mb-4">
                    Receive attendance, marks, and other alerts directly on Telegram.
                </p>

                {telegramMsg.text && (
                    <div className={`p-3 rounded-lg text-sm mb-4 ${telegramMsg.type === 'error' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {telegramMsg.text}
                    </div>
                )}

                {telegramLoading ? (
                    <div className="flex items-center gap-2 text-slate-500">
                        <Loader2 size={16} className="animate-spin" /> Loading...
                    </div>
                ) : telegramStatus.telegramLinked ? (
                    /* ── Connected State ── */
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle size={18} />
                            <span className="font-medium">Telegram Connected</span>
                        </div>
                        <p className="text-sm text-slate-500">
                            Chat ID: <code className="bg-slate-900 px-2 py-0.5 rounded text-slate-300">{telegramStatus.telegramChatId}</code>
                        </p>
                        <button
                            onClick={unlinkTelegram}
                            disabled={telegramActionLoading}
                            className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {telegramActionLoading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                            Disconnect Telegram
                        </button>
                    </div>
                ) : (
                    /* ── Not Connected State ── */
                    <div className="space-y-4">
                        {/* Step 1 */}
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/30">
                            <p className="text-sm font-medium text-slate-200 mb-2">Step 1 — Open the bot</p>
                            <p className="text-sm text-slate-400 mb-3">
                                Click below to open our Telegram bot and press <strong className="text-white">/start</strong>.
                            </p>
                            <a
                                href="https://t.me/attendify_test_1_bot"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors text-sm"
                            >
                                <ExternalLink size={14} />
                                Open AttendifyAlertBot
                            </a>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/30">
                            <p className="text-sm font-medium text-slate-200 mb-2">Step 2 — Paste your Chat ID</p>
                            <p className="text-sm text-slate-400 mb-3">
                                The bot will reply with your <strong className="text-white">Chat ID</strong>. Paste it below.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatIdInput}
                                    onChange={(e) => setChatIdInput(e.target.value)}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-sky-500 focus:outline-none text-sm"
                                    placeholder="e.g. 123456789"
                                />
                                <button
                                    onClick={linkTelegram}
                                    disabled={telegramActionLoading}
                                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                                >
                                    {telegramActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
                                    Link
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
