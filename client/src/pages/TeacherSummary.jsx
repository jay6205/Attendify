import React, { useState, useEffect, useContext } from 'react';
import { BarChart, Users, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';

const TeacherSummary = () => {
    const { user } = useContext(AuthContext);
    const [summaryData, setSummaryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await api.get('/attendance/weekly-summary');
                setSummaryData(res.data);
            } catch (err) {
                console.error("Failed to fetch weekly summary", err);
                setError("Failed to load summary data.");
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-12 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400">
                <AlertCircle size={48} className="mx-auto mb-4" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <PageTransition>
            <div className="space-y-8 pb-20">
                <header>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                        Weekly Summary
                    </h1>
                    <p className="text-slate-400">Overview of attendance and leave activity for the last 7 days.</p>
                </header>

                {summaryData.length === 0 ? (
                    <div className="text-center p-12 bg-slate-800/30 rounded-2xl border border-slate-700/50 dashed-border">
                        <BarChart size={48} className="mx-auto mb-4 text-slate-600" />
                        <h3 className="text-xl font-medium text-slate-300">No Activity</h3>
                        <p className="text-slate-500 mt-2">No attendance or leave records found for this week.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {summaryData.map((course) => (
                            <div key={course.courseId} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-purple-500/30 transition-all">
                                {/* Course Header */}
                                <div className="p-6 border-b border-slate-700/50 bg-slate-800/80">
                                    <h3 className="text-xl font-bold text-slate-100">{course.courseName}</h3>
                                    <p className="text-sm text-slate-400 font-mono">{course.courseCode}</p>
                                </div>

                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Attendance Stats */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Users size={16} /> Attendance
                                        </h4>
                                        
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className="text-4xl font-bold text-slate-200">{course.weeklyAttendance.percentage}%</span>
                                            <span className="text-sm text-slate-500 mb-1">attendance rate</span>
                                        </div>
                                        
                                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-4">
                                            <div 
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" 
                                                style={{ width: `${course.weeklyAttendance.percentage}%` }}
                                            ></div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                            <div className="bg-emerald-500/10 rounded p-2 text-emerald-400">
                                                <div className="font-bold text-lg">{course.weeklyAttendance.present}</div>
                                                <div className="text-xs opacity-70">Present</div>
                                            </div>
                                            <div className="bg-rose-500/10 rounded p-2 text-rose-400">
                                                <div className="font-bold text-lg">{course.weeklyAttendance.absent}</div>
                                                <div className="text-xs opacity-70">Absent</div>
                                            </div>
                                            <div className="bg-amber-500/10 rounded p-2 text-amber-400">
                                                <div className="font-bold text-lg">{course.weeklyAttendance.leave}</div>
                                                <div className="text-xs opacity-70">Excused</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Leave Stats */}
                                    <div className="relative">
                                        <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-700/50 hidden md:block -ml-4"></div>
                                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Clock size={16} /> Leaves
                                        </h4>
                                        
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                                                <div className="flex items-center gap-3 text-amber-400">
                                                    <Clock size={18} />
                                                    <span className="font-medium">Pending</span>
                                                </div>
                                                <span className="font-bold text-slate-200">{course.weeklyLeaves.pending}</span>
                                            </div>
                                            
                                            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                                                <div className="flex items-center gap-3 text-emerald-400">
                                                    <CheckCircle size={18} />
                                                    <span className="font-medium">Approved</span>
                                                </div>
                                                <span className="font-bold text-slate-200">{course.weeklyLeaves.approved}</span>
                                            </div>

                                            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                                                <div className="flex items-center gap-3 text-rose-400">
                                                    <XCircle size={18} />
                                                    <span className="font-medium">Rejected</span>
                                                </div>
                                                <span className="font-bold text-slate-200">{course.weeklyLeaves.rejected}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default TeacherSummary;
