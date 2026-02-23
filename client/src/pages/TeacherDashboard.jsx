import React, { useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckSquare, FileText, BarChart, MessageSquare, Loader2, PieChart as PieChartIcon, Users, Calendar, AlertTriangle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend as RechartsLegend, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, LineChart, Line } from 'recharts';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';

// Feature Card Component
const FeatureCard = ({ title, description, icon: Icon, color, actionLabel, onClick }) => (
    <div
        onClick={onClick}
        className="bg-slate-800/50 p-4 sm:p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/80 transition-all group cursor-pointer"
    >
        <div className={`p-2.5 sm:p-3 rounded-lg w-fit mb-4 ${color} bg-opacity-10`}>
            <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-4">{description}</p>
        <button className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group-hover:gap-2 transition-all">
            {actionLabel} <span>→</span>
        </button>
    </div>
);

const TeacherDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [summaryData, setSummaryData] = useState([]);
    const [courses, setCourses] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, coursesRes, assessmentsRes] = await Promise.all([
                    api.get('/attendance/weekly-summary'),
                    api.get('/academic/courses'),
                    api.get('/marks/assessment/teacher/all')
                ]);
                setSummaryData(summaryRes.data);
                
                // Filter courses for this teacher
                let fetchedCourses = coursesRes.data;
                if (user && user.role === 'teacher') {
                    fetchedCourses = fetchedCourses.filter(c => c.teacher?._id === user._id || c.teacher === user._id);
                }
                setCourses(fetchedCourses);
                setAssessments(assessmentsRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // --- Data Processing for Top Stats ---
    const totalStudents = new Set(courses.flatMap(c => c.students.map(s => s._id || s))).size;
    
    let totalPresentSum = 0;
    let totalClassesSum = 0;
    summaryData.forEach(c => {
        totalPresentSum += c.weeklyAttendance.present;
        totalClassesSum += c.weeklyAttendance.total;
    });
    const overallAttendanceAvg = totalClassesSum > 0 ? Math.round((totalPresentSum / totalClassesSum) * 100) : 0;

    // Calculate Class Average correctly using the already calculated `avgMarks` and maxMarks of each assessment
    let totalPercents = 0;
    let assessedCount = 0;
    assessments.forEach(a => {
        if (a.avgMarks != null && a.maxMarks > 0) {
            totalPercents += (a.avgMarks / a.maxMarks) * 100;
            assessedCount++;
        }
    });
    const overallClassAverage = assessedCount > 0 ? Math.round(totalPercents / assessedCount) : 0;

    const futureAssessments = assessments
        .filter(a => new Date(a.date) >= new Date().setHours(0,0,0,0))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    const upcomingTest = futureAssessments.length > 0 ? futureAssessments[0] : null;

    // --- Data Processing for Middle Charts ---
    const totalPresent = summaryData.reduce((acc, curr) => acc + (curr.weeklyAttendance?.present || 0), 0);
    const totalAbsent = summaryData.reduce((acc, curr) => acc + (curr.weeklyAttendance?.absent || 0), 0);
    const totalLeave = summaryData.reduce((acc, curr) => acc + (curr.weeklyAttendance?.leave || 0), 0);

    const pieData = [
        { name: 'Present', value: totalPresent, fill: '#10b981' },
        { name: 'Absent', value: totalAbsent, fill: '#ef4444' },
        { name: 'Leave', value: totalLeave, fill: '#f59e0b' }
    ].filter(d => d.value > 0);

    // Format data for Marks Distribution (recent 5 assessments)
    const marksData = [...assessments]
        .filter(a => a.submissionCount > 0)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-5)
        .map(a => ({
            name: a.title.substring(0, 10),
            High: a.highestMarks || 0,
            Average: a.avgMarks || 0,
            Low: a.lowestMarks || 0,
            max: a.maxMarks
        }));

    // Format data for Trend Line (recent 10 assessments percentage)
    const trendData = [...assessments]
        .filter(a => a.submissionCount > 0 && a.maxMarks > 0)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-10)
        .map(a => ({
            name: a.title.substring(0, 10),
            Percentage: parseFloat(((a.avgMarks / a.maxMarks) * 100).toFixed(1))
        }));

    // --- Data Processing for Bottom Lists ---
    const allAtRiskStudents = summaryData.flatMap(course => 
        (course.atRiskStudents || []).map(student => ({
            ...student,
            courseName: course.courseName,
            courseCode: course.courseCode
        }))
    ).sort((a, b) => a.attendancePercentage - b.attendancePercentage);

    const pendingTasks = summaryData.filter(c => c.weeklyLeaves?.pending > 0);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <PageTransition>
            <div className="space-y-8 pb-20">
                {/* Header */}
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                            Teacher Portal
                        </h1>
                        <p className="text-slate-400">
                            Welcome back, <span className="text-white font-medium">{user?.name}</span>
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm border border-indigo-500/20">
                            {user?.details?.department || 'Department'}
                        </span>
                    </div>
                </header>

                {/* Quick Actions Bar */}
                <div className="flex flex-wrap gap-2 sm:gap-4 pb-4 border-b border-slate-700/50">
                     <button onClick={() => navigate('/teacher/attendance')} className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-indigo-500/20">
                        <CheckSquare size={16} /> Mark Attendance
                    </button>
                    <button onClick={() => navigate('/teacher/courses')} className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-emerald-500/20">
                        <BookOpen size={16} /> My Courses
                    </button>
                    <button onClick={() => navigate('/teacher/question-paper/create')} className="flex items-center gap-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-pink-500/20">
                        <FileText size={16} /> Create Paper
                    </button>
                    <button onClick={() => navigate('/teacher/leaves')} className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-amber-500/20">
                         <FileText size={16} /> Leave Requests
                    </button>
                     <button onClick={() => navigate('/teacher/feedback')} className="flex items-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-cyan-500/20">
                        <MessageSquare size={16} /> View Feedback
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20"><Loader2 size={40} className="animate-spin text-indigo-500 opacity-50" /></div>
                ) : (
                    <>
                        {/* TOP: Quick Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 flex flex-col justify-center">
                                <div className="text-slate-400 text-sm mb-1 flex items-center gap-2"><Users size={16} /> Total Students</div>
                                <div className="text-3xl font-bold text-slate-100">{totalStudents}</div>
                            </div>
                            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 flex flex-col justify-center">
                                <div className="text-slate-400 text-sm mb-1 flex items-center gap-2"><PieChartIcon size={16} /> Attendance %</div>
                                <div className={`text-3xl font-bold ${overallAttendanceAvg >= 75 ? 'text-emerald-400' : overallAttendanceAvg >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                                    {overallAttendanceAvg}%
                                </div>
                            </div>
                            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 flex flex-col justify-center">
                                <div className="text-slate-400 text-sm mb-1 flex items-center gap-2"><BarChart size={16} /> Class Average</div>
                                <div className="text-3xl font-bold text-indigo-400">{overallClassAverage}%</div>
                            </div>
                            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 flex flex-col justify-center">
                                <div className="text-slate-400 text-sm mb-1 flex items-center gap-2"><Calendar size={16} /> Upcoming Test</div>
                                <div className="text-xl font-bold text-slate-100 truncate">{upcomingTest ? upcomingTest.title : 'None'}</div>
                                {upcomingTest && <div className="text-xs text-slate-400">{new Date(upcomingTest.date).toLocaleDateString()}</div>}
                            </div>
                        </div>

                        {/* MIDDLE: Core Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                             {/* Attendance Pie */}
                            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 flex flex-col min-h-[300px]">
                                <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2"><PieChartIcon className="text-indigo-400" size={18} /> Attendance Pie (7 Days)</h3>
                                {pieData.length > 0 ? (
                                    <div className="flex-1 w-full mt-2">
                                        <ResponsiveContainer width="100%" height={220}>
                                            <PieChart>
                                                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0' }} />
                                                <RechartsLegend wrapperStyle={{ paddingTop: '10px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500"><PieChartIcon size={40} className="mx-auto mb-2 opacity-20" /><p className="text-sm">No data</p></div>
                                )}
                            </div>

                            {/* Marks Distribution */}
                            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 flex flex-col min-h-[300px]">
                                <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2"><BarChart className="text-indigo-400" size={18} /> Marks Distribution</h3>
                                {marksData.length > 0 ? (
                                    <div className="flex-1 w-full">
                                        <ResponsiveContainer width="100%" height={220}>
                                            <RechartsBarChart data={marksData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#475569' }} />
                                                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#475569' }} />
                                                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }} cursor={{ fill: 'rgba(51, 65, 85, 0.4)' }} />
                                                <RechartsLegend wrapperStyle={{ paddingTop: '10px', fontSize: 12 }} />
                                                <Bar dataKey="High" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={30} />
                                                <Bar dataKey="Average" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={30} />
                                                <Bar dataKey="Low" fill="#ef4444" radius={[2, 2, 0, 0]} maxBarSize={30} />
                                            </RechartsBarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                   <div className="flex-1 flex flex-col items-center justify-center text-slate-500"><BarChart size={40} className="mx-auto mb-2 opacity-20" /><p className="text-sm">No recent assessments</p></div>
                                )}
                            </div>

                            {/* Class Average Trend */}
                            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 flex flex-col min-h-[300px]">
                                <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2"><svg className="text-indigo-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> Class Average Trend (%)</h3>
                                {trendData.length > 0 ? (
                                    <div className="flex-1 w-full">
                                        <ResponsiveContainer width="100%" height={220}>
                                            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#475569' }} />
                                                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#475569' }} domain={[0, 100]} />
                                                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }} />
                                                <Line type="monotone" dataKey="Percentage" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                   <div className="flex-1 flex flex-col items-center justify-center text-slate-500"><svg className="mx-auto w-10 h-10 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg><p className="text-sm">No trend data</p></div>
                                )}
                            </div>
                        </div>

                        {/* BOTTOM: Action Lists */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Weak Students (Placeholder/Aggregated) */}
                            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 flex flex-col max-h-[350px]">
                                <h3 className="font-bold text-slate-100 mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2"><AlertTriangle className="text-amber-400" size={18} /> Weak Students</div>
                                </h3>
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 overflow-hidden text-center p-4">
                                     <Users size={32} className="mx-auto mb-2 opacity-20" />
                                     <p className="text-sm">Detailed performance tracking per student will be available soon.</p>
                                </div>
                            </div>

                            {/* Low Attendance Alerts */}
                            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 flex flex-col max-h-[350px]">
                                <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
                                    <AlertTriangle className="text-rose-400" size={18} /> Low Attendance Alerts
                                </h3>
                                {allAtRiskStudents.length > 0 ? (
                                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                                        {allAtRiskStudents.map((student, idx) => (
                                            <div key={`${student.studentId}-${idx}`} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex justify-between items-center">
                                                <div className="min-w-0 pr-2">
                                                    <p className="font-medium text-slate-200 text-sm truncate">{student.name}</p>
                                                    <p className="text-xs text-slate-400 truncate">{student.courseName}</p>
                                                </div>
                                                <div className="bg-rose-500/10 text-rose-400 px-2 py-1 rounded text-xs font-bold border border-rose-500/20 whitespace-nowrap">
                                                    {student.attendancePercentage}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                                        <CheckSquare size={32} className="mx-auto mb-2 text-emerald-500/30" />
                                        <p className="text-sm">No students currently at risk.</p>
                                    </div>
                                )}
                            </div>

                            {/* Pending Tasks */}
                            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 flex flex-col max-h-[350px]">
                                <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
                                    <CheckSquare className="text-indigo-400" size={18} /> Pending Tasks
                                </h3>
                                {pendingTasks.length > 0 ? (
                                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                                        {pendingTasks.map(task => (
                                            <div key={`pt-${task.courseId}`} className="bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/20 flex flex-col gap-2">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-medium text-slate-200 text-sm truncate">{task.courseName}</span>
                                                    <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">Leaves</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-xs text-slate-400">{task.weeklyLeaves.pending} pending leave request(s)</span>
                                                    <Link to="/teacher/leaves" className="text-xs text-indigo-400 hover:text-indigo-300">Review →</Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                                        <CheckSquare size={32} className="mx-auto mb-2 text-emerald-500/30" />
                                        <p className="text-sm">All caught up!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </PageTransition>
    );
};

export default TeacherDashboard;
