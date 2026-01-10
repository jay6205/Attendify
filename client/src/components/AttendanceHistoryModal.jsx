import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/axios';

const AttendanceHistoryModal = ({ subject, onClose, onUpdate }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, [subject]);

    const fetchLogs = async () => {
        try {
            const res = await api.get(`/attendance/logs/${subject._id}`);
            setLogs(res.data);
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (logId) => {
        if (!window.confirm("Delete this entry? Stats will be reverted.")) return;

        try {
            await api.delete(`/attendance/logs/${logId}`);
            setLogs(logs.filter(l => l._id !== logId));
            onUpdate(); // Refresh parent SubjectCard to show new stats
        } catch (error) {
            console.error("Failed to delete log", error);
            alert("Failed to delete entry");
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Calendar size={18} className="text-indigo-400" />
                        History: {subject.name}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-4 space-y-3 flex-1">
                    {loading ? (
                        <div className="text-center text-slate-500 py-8">Loading logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center text-slate-500 py-8 flex flex-col items-center gap-2">
                            <Calendar size={32} className="opacity-20" />
                            <p>No attendance history found.</p>
                        </div>
                    ) : (
                        logs.map(log => (
                            <div key={log._id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${
                                        log.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                    }`}>
                                        {log.status === 'Present' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${log.status === 'Present' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {log.status}
                                        </p>
                                        <p className="text-xs text-slate-500">{formatDate(log.date)}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDelete(log._id)}
                                    className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                    title="Delete Entry"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-800/30 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500">Deleting an entry will automatically recalculate your attendance percentage.</p>
                </div>
            </div>
        </div>
    );
};

export default AttendanceHistoryModal;
