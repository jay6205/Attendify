import React, { useState, useEffect, useContext } from 'react';
import { CheckCircle, XCircle, User, Calendar, Clock, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';

const TeacherLeaves = () => {
    const { user } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null); // ID of request being processed

    const fetchRequests = async () => {
        try {
            // Fetch ALL requests, then filter for Pending client-side for better UX?
            // Actually API supports filtering. Let's fetch all to show history if needed, but for now just pending.
            const res = await api.get('/leaves?status=Pending');
            setRequests(res.data);
        } catch (err) {
            console.error("Failed to fetch leave requests", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id, status) => {
        setProcessing(id);
        try {
            await api.put(`/leaves/${id}`, { status });
            // Remove from list or update status
            setRequests(prev => prev.filter(req => req._id !== id));
            // Assuming we only show Pending, so removing it is correct.
        } catch (err) {
            console.error(`Failed to ${status} request`, err);
            alert(`Failed to ${status} request`);
        } finally {
            setProcessing(null);
        }
    };

    return (
        <PageTransition>
            <div className="space-y-8 pb-20">
                <header>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-1">
                        Leave Requests
                    </h1>
                    <p className="text-slate-400">Review and manage student leave applications.</p>
                </header>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-amber-500"></div></div>
                ) : requests.length === 0 ? (
                    <div className="text-center p-12 bg-slate-800/30 rounded-2xl border border-slate-700/50 dashed-border">
                        <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500/50" />
                        <h3 className="text-xl font-medium text-slate-300">All Caught Up!</h3>
                        <p className="text-slate-500 mt-2">There are no pending leave requests to review.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {requests.map(req => (
                            <div key={req._id} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all hover:border-indigo-500/30">
                                {/* Info Section */}
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-500/10 rounded-full text-indigo-400">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-200 text-lg">{req.student?.name || 'Unknown Student'}</h3>
                                                <p className="text-xs text-slate-500">{req.student?.details?.studentId}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Clock size={12} /> Pending
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/30">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Course</p>
                                            <p className="text-slate-300 font-medium">{req.course?.name} ({req.course?.code})</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Date Range</p>
                                            <div className="flex items-center gap-2 text-slate-300 font-medium">
                                                <Calendar size={14} className="text-indigo-400" />
                                                {new Date(req.startDate).toLocaleDateString()} — {new Date(req.endDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Reason</p>
                                            <p className="text-slate-300 italic">"{req.reason}"</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Section */}
                                <div className="flex flex-row lg:flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-slate-700/50 pt-4 lg:pt-0 lg:pl-6">
                                    <button 
                                        onClick={() => handleAction(req._id, 'Approved')}
                                        disabled={!!processing}
                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <CheckCircle size={18} /> Approve
                                    </button>
                                    <button 
                                        onClick={() => handleAction(req._id, 'Rejected')}
                                        disabled={!!processing}
                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-700 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-rose-600/20 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <XCircle size={18} /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default TeacherLeaves;
