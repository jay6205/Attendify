import React, { useState, useEffect } from 'react';
import { Building2, Users, BookOpen, Award, Activity, TrendingUp, BarChart2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v2';

// ── Stat Card ──
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
        <div className="flex items-start justify-between gap-2">
            <div>
                <p className="text-slate-400 text-xs sm:text-sm font-medium mb-1">{label}</p>
                <h3 className="text-xl sm:text-2xl font-bold text-white">{value}</h3>
                {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
            </div>
            <div className={`p-2 sm:p-3 rounded-lg ${color}`}>
                <Icon size={20} className="text-white sm:w-[22px] sm:h-[22px]" />
            </div>
        </div>
    </div>
);

// ── Simple Horizontal Bar ──
const HorizontalBar = ({ label, value, max, color }) => {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-slate-300 font-medium truncate mr-2">{label}</span>
                <span className="text-slate-400 shrink-0">{value}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

// ── Time Ago Helper ──
const timeAgo = (dateStr) => {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

const UsageDashboard = () => {
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/super-admin/metrics`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setMetrics(data);
            } else {
                setError(data?.message || 'Failed to fetch metrics');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    // ── Aggregate totals ──
    const totals = metrics.reduce((acc, m) => ({
        orgs: acc.orgs + 1,
        users: acc.users + (m?.users?.admins || 0) + (m?.users?.teachers || 0) + (m?.users?.students || 0),
        students: acc.students + (m?.users?.students || 0),
        courses: acc.courses + (m?.academic?.courses || 0),
        assessments: acc.assessments + (m?.academic?.assessments || 0)
    }), { orgs: 0, users: 0, students: 0, courses: 0, assessments: 0 });

    // ── Top 5 by students ──
    const top5 = [...metrics]
        .sort((a, b) => (b?.users?.students || 0) - (a?.users?.students || 0))
        .slice(0, 5);
    const maxStudents = top5[0]?.users?.students || 1;

    const barColors = [
        'bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-cyan-500', 'bg-teal-500'
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Usage Metrics</h1>
                <p className="text-slate-400">Organization-level usage overview</p>
            </div>

            {error && (
                <div className="bg-rose-500/10 text-rose-400 p-4 rounded-lg border border-rose-500/20">{error}</div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="col-span-2 sm:col-span-1">
                    <StatCard icon={Building2} label="Organizations" value={totals.orgs} color="bg-indigo-500" />
                </div>
                <StatCard icon={Users} label="Total Users" value={totals.users} color="bg-purple-500" />
                <StatCard icon={Users} label="Students" value={totals.students} color="bg-blue-500" />
                <StatCard icon={BookOpen} label="Courses" value={totals.courses} color="bg-cyan-500" />
                <StatCard icon={Award} label="Assessments" value={totals.assessments} color="bg-teal-500" />
            </div>

            {/* Main Grid: Table + Chart */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* ── Org Metrics Table ── */}
                <div className="xl:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-700">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <BarChart2 size={20} className="text-indigo-400" />
                            Organization Breakdown
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-base border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-400">
                                    <th className="p-2 sm:p-3 font-medium">Organization</th>
                                    <th className="p-2 sm:p-3 font-medium text-center hidden sm:table-cell">Admins</th>
                                    <th className="p-2 sm:p-3 font-medium text-center hidden sm:table-cell">Teachers</th>
                                    <th className="p-2 sm:p-3 font-medium text-center">Students</th>
                                    <th className="p-2 sm:p-3 font-medium text-center hidden md:table-cell">Courses</th>
                                    <th className="p-2 sm:p-3 font-medium text-center hidden md:table-cell">Assessments</th>
                                    <th className="p-2 sm:p-3 font-medium text-center">30d Growth</th>
                                    <th className="p-2 sm:p-3 font-medium hidden sm:table-cell">Last Activity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {metrics?.length === 0 ? (
                                    <tr><td colSpan="8" className="p-6 text-center text-slate-400">No organizations found</td></tr>
                                ) : (
                                    metrics?.map(m => {
                                        const latestActivity = [
                                            m?.activity?.lastAdminLogin,
                                            m?.activity?.lastTeacherAction,
                                            m?.activity?.lastStudentAction
                                        ].filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0];

                                        return (
                                            <tr key={m?.organizationId} className="hover:bg-slate-750 transition-colors">
                                                <td className="p-2 sm:p-3 whitespace-nowrap">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                        <span className="text-white font-medium truncate max-w-[120px] sm:max-w-none">{m?.organizationName}</span>
                                                        {!m?.isActive && (
                                                            <span className="text-[10px] sm:text-xs bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20 w-max">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                    {m?.organizationCode && (
                                                        <span className="text-xs text-slate-500">{m?.organizationCode}</span>
                                                    )}
                                                </td>
                                                <td className="p-2 sm:p-3 text-center text-slate-300 hidden sm:table-cell">{m?.users?.admins || 0}</td>
                                                <td className="p-2 sm:p-3 text-center text-slate-300 hidden sm:table-cell">{m?.users?.teachers || 0}</td>
                                                <td className="p-2 sm:p-3 text-center text-slate-300">{m?.users?.students || 0}</td>
                                                <td className="p-2 sm:p-3 text-center text-slate-300 hidden md:table-cell">{m?.academic?.courses || 0}</td>
                                                <td className="p-2 sm:p-3 text-center text-slate-300 hidden md:table-cell">{m?.academic?.assessments || 0}</td>
                                                <td className="p-2 sm:p-3 text-center">
                                                    <span className={`text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full ${(m?.growth?.studentsLast30Days || 0) > 0
                                                        ? 'bg-emerald-500/10 text-emerald-400'
                                                        : 'bg-slate-700 text-slate-400'
                                                        }`}>
                                                        +{m?.growth?.studentsLast30Days || 0}
                                                    </span>
                                                </td>
                                                <td className="p-2 sm:p-3 text-slate-400 text-xs hidden sm:table-cell whitespace-nowrap">{timeAgo(latestActivity)}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Top 5 Sidebar ── */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-emerald-400" />
                        Top Organizations
                    </h2>
                    <p className="text-xs text-slate-500 mb-5">By student count</p>
                    <div className="space-y-4">
                        {top5?.map((m, i) => (
                            <HorizontalBar
                                key={m?.organizationId}
                                label={m?.organizationName}
                                value={m?.users?.students || 0}
                                max={maxStudents}
                                color={barColors[i] || 'bg-slate-500'}
                            />
                        ))}
                        {top5?.length === 0 && (
                            <p className="text-slate-400 text-sm">No data yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsageDashboard;
