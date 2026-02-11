import React, { useState, useEffect } from 'react';
import { Brain, Clock, CheckCircle, AlertCircle, Send, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';

const StudentActiveSessionCard = ({ courseId, courseName }) => {
    const [session, setSession] = useState(null);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, submitting, success, failed
    const [message, setMessage] = useState('');

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await api.get(`/attendance/ai/session/active/${courseId}`);
                if (res.data) {
                    setSession(res.data);
                }
            } catch (error) {
                console.error("Failed to check active session", error);
            }
        };

        checkSession();
        // Optional: Poll every 30s? For now, run once on mount.
    }, [courseId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!answer.trim()) return;

        setLoading(true);
        setStatus('submitting');

        try {
            const res = await api.post('/attendance/ai/session/submit', {
                sessionId: session._id,
                answer
            });

            if (res.data.status === 'Approved') {
                setStatus('success');
                setMessage('Attendance Marked! (Keyword Verified)');
            } else if (res.data.status === 'Pending') {
                setStatus('success'); // UI treats pending verification as "Submitted Successfully"
                setMessage('Answer Received. verifying with AI...');
            } else {
                setStatus('failed');
                setMessage('Submission Failed.');
            }
        } catch (error) {
            setStatus('failed');
            setMessage(error.response?.data?.message || 'Submission Failed');
        } finally {
            setLoading(false);
        }
    };

    if (!session) return null; // Don't render anything if no active session

    if (status === 'success') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 mb-6"
            >
                <div className="flex items-center gap-4 text-emerald-400">
                    <CheckCircle size={32} />
                    <div>
                        <h3 className="font-bold text-lg">Submission Successful!</h3>
                        <p className="text-sm opacity-80">{message}</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Calculate time left
    const timeLeft = new Date(session.expiresAt) - new Date();
    const minutesLeft = Math.max(0, Math.floor(timeLeft / 60000));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-6 mb-6 relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />

            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                        <Brain size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Attendance Question</h3> {/* Changed from "Live Attendance Question" to generic to avoid confusion if old */}
                        <p className="text-sm text-indigo-300">{courseName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full text-xs font-medium">
                    <Clock size={14} />
                    <span>{minutesLeft}m remaining</span>
                </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-700/50">
                <p className="text-slate-200 font-medium">
                    {session.question}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    disabled={loading}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={loading || !answer.trim()}
                    className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                    Submit
                </button>
            </form>

            {status === 'failed' && (
                <div className="mt-3 flex items-center gap-2 text-rose-400 text-sm">
                    <AlertCircle size={14} />
                    {message}
                </div>
            )}
        </motion.div>
    );
};

export default StudentActiveSessionCard;
