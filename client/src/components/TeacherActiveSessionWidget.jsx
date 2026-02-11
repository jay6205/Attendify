import React, { useState, useEffect } from 'react';
import { RefreshCw, Users, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';

const TeacherActiveSessionWidget = ({ sessionId, onClose }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stopping, setStopping] = useState(false);

    const handleStopSession = async () => {
        if (!window.confirm("End Session now? This will mark all remaining students as ABSENT.")) return;

        setStopping(true);
        try {
            await api.post('/attendance/ai/session/stop', { sessionId });
            // Maybe show success toast? For now just close.
            onClose();
        } catch (error) {
            console.error("Failed to stop session", error);
            alert("Failed to stop session");
            setStopping(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get(`/attendance/ai/session/${sessionId}/stats`);
            setStats(res.data);
            setLoading(false);

            // Auto-close if backend says inactive?
            if (!res.data.session.isActive) {
                onClose();
            }
        } catch (error) {
            console.error("Failed to fetch session stats", error);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [sessionId]);

    if (loading || !stats) {
        return (
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 bg-slate-700 rounded-full"></div>
                <div className="h-4 bg-slate-700 rounded w-1/3"></div>
            </div>
        );
    }

    const { totalEnrolled, totalSubmitted, pending, approved, rejected } = stats.stats;
    const progress = totalEnrolled > 0 ? (totalSubmitted / totalEnrolled) * 100 : 0;

    // Calculate Time Left
    const timeLeft = new Date(stats.session.expiresAt) - new Date();
    const minutesLeft = Math.max(0, Math.floor(timeLeft / 60000));
    const secondsLeft = Math.max(0, Math.floor((timeLeft % 60000) / 1000));

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-6 mb-8 relative overflow-hidden"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        Live Session Active
                    </h3>
                    <p className="text-indigo-300 text-sm mt-1 max-w-xl truncate">
                        Q: {stats.session.question}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-white flex items-center justify-end gap-2">
                        <Clock size={20} className="text-orange-400" />
                        {minutesLeft}:{secondsLeft.toString().padStart(2, '0')}
                    </div>
                    <span className="text-xs text-slate-400">Time Remaining</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative z-10 mb-6">
                <div className="flex justify-between text-sm text-slate-300 mb-2">
                    <span>Participation</span>
                    <span>{totalSubmitted} / {totalEnrolled} Students</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-slate-400 text-xs mb-1">Processing (LLM)</div>
                    <div className="text-xl font-bold text-orange-400 flex items-center gap-2">
                        {pending > 0 && <Loader2 size={16} className="animate-spin" />}
                        {pending}
                    </div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-slate-400 text-xs mb-1">Approved</div>
                    <div className="text-xl font-bold text-emerald-400">{approved}</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-slate-400 text-xs mb-1">Rejected</div>
                    <div className="text-xl font-bold text-rose-400">{rejected}</div>
                </div>
                <button
                    onClick={handleStopSession}
                    disabled={stopping}
                    className="bg-rose-500/10 border border-rose-500/50 p-3 rounded-lg flex flex-col items-center justify-center hover:bg-rose-500/20 transition-colors disabled:opacity-50 cursor-pointer group"
                >
                    <div className="text-rose-400 font-bold text-sm group-hover:text-rose-300 flex items-center gap-1">
                        {stopping ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                        {stopping ? "Stopping..." : "Stop Session"}
                    </div>
                    <span className="text-[10px] text-rose-500/70">Finalizes Attendance</span>
                </button>
            </div>

            {/* Background Decoration */}
            <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
                <Users size={150} />
            </div>
        </motion.div>
    );
};

export default TeacherActiveSessionWidget;
