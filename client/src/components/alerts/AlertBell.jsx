import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Bell } from 'lucide-react';
import api from '../../api/axios';
import AlertDropdown from './AlertDropdown';
import AuthContext from '../../context/AuthContext';

const AlertBell = () => {
    const { loginAs, user } = useContext(AuthContext);
    const portal = loginAs || user?.role || 'student';

    const [unreadCount, setUnreadCount] = useState(0);
    const [alerts, setAlerts] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const bellRef = useRef(null);

    const fetchAlerts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/alerts/my?limit=20&portal=${portal}`);
            setAlerts(res.data.alerts);
            setUnreadCount(res.data.unreadCount);
        } catch (err) {
            console.error('Failed to fetch alerts:', err);
        } finally {
            setLoading(false);
        }
    }, [portal]);

    // Poll every 60s + fetch on mount
    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, [fetchAlerts]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkRead = async (alertId) => {
        // Find the alert and only proceed if it was actually unread
        const targetAlert = alerts.find(a => a._id === alertId);
        if (!targetAlert || targetAlert.isRead) return;

        try {
            await api.put(`/alerts/${alertId}/read`, { portal });
            setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, isRead: true } : a));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark alert read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/alerts/read-all', { portal });
            setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all read:', err);
        }
    };

    return (
        <div className="relative" ref={bellRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                aria-expanded={isOpen}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full px-1 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <AlertDropdown
                    alerts={alerts}
                    loading={loading}
                    onMarkRead={handleMarkRead}
                    onMarkAllRead={handleMarkAllRead}
                    onClose={() => setIsOpen(false)}
                    unreadCount={unreadCount}
                />
            )}
        </div>
    );
};

export default AlertBell;
