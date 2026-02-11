import React, { useState } from 'react';
import { X, Brain, Clock, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const TeacherSessionModal = ({ courseId, onClose, onSuccess }) => {
    const [question, setQuestion] = useState('');
    const [keywords, setKeywords] = useState('');
    const [duration, setDuration] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Split keywords by comma and clean
            const callbackKeywords = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);

            const res = await api.post('/attendance/ai/session/start', {
                courseId,
                question,
                keywords: callbackKeywords,
                durationMinutes: duration
            });

            onSuccess(res.data._id);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to start session');
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
                >
                    <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                <Brain size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-white">Start AI Attendance</h2>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Attendance Question
                            </label>
                            <textarea
                                required
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="e.g., What was the key takeaway from the React Hooks chapter?"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors h-24 resize-none"
                            />
                            <p className="mt-2 text-xs text-slate-500">
                                Students must answer this to be marked present.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                <Key size={16} className="text-emerald-400" />
                                Valid Keywords (Optional)
                            </label>
                            <input
                                type="text"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                placeholder="hooks, state, effect (comma separated)"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                            <p className="mt-2 text-xs text-slate-500">
                                Answers containing these words are approved instantly (skips AI).
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                <Clock size={16} className="text-orange-400" />
                                Session Duration: <span className="text-white">{duration} min</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="30"
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-2">
                                <span>1 min</span>
                                <span>30 min</span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Starting...' : 'Start Session'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TeacherSessionModal;
