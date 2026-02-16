import React from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, CheckCheck, Clock, AlertTriangle, BookOpen, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const typeConfig = {
    ABSENT: { icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    MARKS_PUBLISHED: { icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    LOW_ATTENDANCE: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    GENERAL: { icon: Info, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
};

const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const AlertDropdown = ({ alerts, loading, onMarkRead, onMarkAllRead, onClose, unreadCount }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-[380px] max-h-[480px] bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-[100]"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/40">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Bell size={16} className="text-indigo-400" />
                    Notifications
                    {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            {unreadCount}
                        </span>
                    )}
                </h3>
                {unreadCount > 0 && (
                    <button
                        onClick={onMarkAllRead}
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        <CheckCheck size={14} />
                        Mark all read
                    </button>
                )}
            </div>

            {/* Alerts List */}
            <div className="overflow-y-auto max-h-[360px] divide-y divide-slate-800/50">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <BellOff size={32} className="text-slate-600 mb-3" />
                        <p className="text-sm text-slate-500">No notifications yet</p>
                        <p className="text-xs text-slate-600 mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    alerts.map((alert) => {
                        const config = typeConfig[alert.type] || typeConfig.GENERAL;
                        const Icon = config.icon;
                        return (
                            <div
                                key={alert._id}
                                onClick={() => !alert.isRead && onMarkRead(alert._id)}
                                className={`px-5 py-3.5 flex gap-3 cursor-pointer transition-colors hover:bg-slate-800/40 ${
                                    !alert.isRead ? 'bg-slate-800/20' : ''
                                }`}
                            >
                                {/* Icon */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.bg} border ${config.border}`}>
                                    <Icon size={15} className={config.color} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`text-sm font-medium truncate ${!alert.isRead ? 'text-slate-100' : 'text-slate-400'}`}>
                                            {alert.title}
                                        </p>
                                        {!alert.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                        {alert.message}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1.5 text-slate-600">
                                        <Clock size={10} />
                                        <span className="text-[10px]">{timeAgo(alert.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
                <div className="border-t border-slate-700/40 px-5 py-3">
                    <Link
                        to="/alerts"
                        onClick={onClose}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                        View all notifications →
                    </Link>
                </div>
            )}
        </motion.div>
    );
};

export default AlertDropdown;
