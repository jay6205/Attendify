import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Compass, X, ChevronRight, Sparkles } from 'lucide-react';

const QUICK_ACTIONS = {
    student: [
        { label: 'View Achievements', path: '/student/achievements', emoji: '🏆' },
        { label: 'Check Marks', path: '/student/marks', emoji: '📊' },
        { label: 'My Performance', path: '/student/performance', emoji: '📈' },
        { label: 'Try AI Advisor', path: '/ai-advisor', emoji: '🤖' },
        { label: 'Leave Requests', path: '/student/leaves', emoji: '📝' },
    ],
    parent: [
        { label: 'View Dashboard', path: '/student', emoji: '📋' },
        { label: 'My Performance', path: '/student/performance', emoji: '📈' },
        { label: 'Try AI Advisor', path: '/ai-advisor', emoji: '🤖' },
    ],
    admin: [
        { label: 'View Performance', path: '/admin/performance', emoji: '📊' },
        { label: 'Create Feedback', path: '/admin/feedback/create', emoji: '💬' },
        { label: 'Feedback Summary', path: '/admin/feedback', emoji: '📋' },
        { label: 'System Settings', path: '/admin/system', emoji: '⚙️' },
    ],
    teacher: [
        { label: 'My Courses', path: '/teacher/courses', emoji: '📚' },
        { label: 'Attendance', path: '/teacher/attendance', emoji: '✅' },
        { label: 'Marks', path: '/teacher/marks', emoji: '📝' },
        { label: 'Analytics', path: '/teacher/marks/analytics', emoji: '📊' },
        { label: 'Question Paper', path: '/teacher/question-paper/create', emoji: '📄' },
    ],
};

const STORAGE_KEY = 'attendify_welcome_dismissed';

const WelcomeBanner = () => {
    const { user, loginAs } = useContext(AuthContext);
    const navigate = useNavigate();
    const [dismissed, setDismissed] = useState(() => {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    });

    if (dismissed || !user) return null;

    const effectiveRole = loginAs === 'parent' ? 'parent' : (user?.role || 'student');
    const actions = QUICK_ACTIONS[effectiveRole] || QUICK_ACTIONS.student;

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setDismissed(true);
    };

    return (
        <AnimatePresence>
            {!dismissed && (
                <motion.div
                    initial={{ opacity: 0, y: -12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.98 }}
                    transition={{ duration: 0.35 }}
                    className="relative mb-6 overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-slate-800/50 to-purple-500/5 backdrop-blur-md"
                >
                    {/* Decorative gradient border top */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                    <div className="p-5">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                    <Compass size={16} className="text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                                        Welcome! Here's what to explore
                                        <Sparkles size={14} className="text-amber-400" />
                                    </h3>
                                    <p className="text-[11px] text-slate-500">
                                        Quick navigation guide for first-time visitors
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors"
                                aria-label="Dismiss welcome banner"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                            {actions.map((action) => (
                                <button
                                    key={action.path}
                                    onClick={() => navigate(action.path)}
                                    className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-indigo-500/30 hover:bg-slate-700/50 text-xs text-slate-300 hover:text-slate-100 transition-all"
                                >
                                    <span>{action.emoji}</span>
                                    <span className="font-medium">{action.label}</span>
                                    <ChevronRight size={12} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                                </button>
                            ))}
                        </div>

                        {/* Dismiss link */}
                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={handleDismiss}
                                className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
                            >
                                Don't show again
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeBanner;
