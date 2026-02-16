import React, { useState, useEffect, useCallback, useContext } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, CheckCheck, Clock, AlertTriangle, BookOpen, Info, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import AuthContext from '../../context/AuthContext';
import PageTransition from '../PageTransition';

const typeConfig = {
    ABSENT: { icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', label: 'Absence' },
    MARKS_PUBLISHED: { icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', label: 'Marks' },
    LOW_ATTENDANCE: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Low Attendance' },
    GENERAL: { icon: Info, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', label: 'General' },
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
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const AlertListPage = () => {
    const { loginAs, user } = useContext(AuthContext);
    const portal = loginAs || user?.role || 'student';

    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [filter, setFilter] = useState('all'); // all | unread | read

    const fetchAlerts = useCallback(async (pageNum = 1) => {
        try {
            setLoading(true);
            const res = await api.get(`/alerts/my?page=${pageNum}&limit=20&portal=${portal}`);
            setAlerts(pageNum === 1 ? res.data.alerts : prev => [...prev, ...res.data.alerts]);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Failed to fetch alerts:', err);
        } finally {
            setLoading(false);
        }
    }, [portal]);

    useEffect(() => {
        setPage(1);
        fetchAlerts(1);
    }, [fetchAlerts]);

    const handleMarkRead = async (alertId) => {
        const targetAlert = alerts.find(a => a._id === alertId);
        if (!targetAlert || targetAlert.isRead) return;

        try {
            await api.put(`/alerts/${alertId}/read`, { portal });
            setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, isRead: true } : a));
        } catch (err) {
            console.error('Failed to mark read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/alerts/read-all', { portal });
            setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all read:', err);
        }
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchAlerts(nextPage);
    };

    const handleAlertKeyDown = (e, alert) => {
        if ((e.key === 'Enter' || e.key === ' ') && !alert.isRead) {
            e.preventDefault();
            handleMarkRead(alert._id);
        }
    };

    const filteredAlerts = alerts.filter(a => {
        if (filter === 'unread') return !a.isRead;
        if (filter === 'read') return a.isRead;
        return true;
    });

    const unreadCount = alerts.filter(a => !a.isRead).length;

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
    const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

    return (
        <PageTransition>
            <div className="space-y-6 pb-20">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-1">
                            Notifications
                        </h1>
                        <p className="text-slate-400 flex items-center gap-2">
                            <Bell size={18} />
                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Filter Tabs */}
                        <div className="flex bg-slate-800/60 rounded-lg border border-slate-700/40 p-0.5">
                            {['all', 'unread', 'read'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                                        filter === f
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg transition-colors"
                            >
                                <CheckCheck size={14} />
                                Mark all read
                            </button>
                        )}
                    </div>
                </header>

                {/* Alerts */}
                {loading && alerts.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={28} className="animate-spin text-indigo-400" />
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-16 text-center">
                        <BellOff size={48} className="mx-auto mb-4 text-slate-600" />
                        <h3 className="text-lg font-bold text-slate-300">No notifications</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            {filter !== 'all' ? `No ${filter} notifications.` : "You're all caught up!"}
                        </p>
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-2"
                    >
                        {filteredAlerts.map((alert) => {
                            const config = typeConfig[alert.type] || typeConfig.GENERAL;
                            const Icon = config.icon;
                            return (
                                <motion.div
                                    key={alert._id}
                                    variants={item}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => !alert.isRead && handleMarkRead(alert._id)}
                                    onKeyDown={(e) => handleAlertKeyDown(e, alert)}
                                    className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                                        !alert.isRead
                                            ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'
                                            : 'bg-slate-800/20 border-slate-800/30 hover:bg-slate-800/30'
                                    }`}
                                >
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg} border ${config.border}`}>
                                        <Icon size={18} className={config.color} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className={`text-sm font-semibold ${!alert.isRead ? 'text-slate-100' : 'text-slate-400'}`}>
                                                    {alert.title}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {alert.message}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {!alert.isRead && (
                                                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                                                )}
                                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${config.bg} ${config.color} border ${config.border}`}>
                                                    {config.label}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 mt-2 text-slate-600">
                                            <Clock size={11} />
                                            <span className="text-[11px]">{timeAgo(alert.createdAt)}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* Load More */}
                {pagination && page < pagination.pages && (
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={handleLoadMore}
                            disabled={loading}
                            className="px-6 py-2.5 text-sm font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Load more'}
                        </button>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default AlertListPage;
