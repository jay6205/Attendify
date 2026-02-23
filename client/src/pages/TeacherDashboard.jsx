import React, { useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckSquare, FileText, BarChart, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await api.get('/attendance/weekly-summary');
                setSummaryData(res.data);
            } catch (error) {
                console.error("Failed to fetch summary data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    // Format data for the chart
    const chartData = summaryData.map(course => ({
        name: course.courseCode || course.courseName.substring(0, 10),
        fullCourseName: course.courseName,
        Present: course.weeklyAttendance?.present || 0,
        Absent: course.weeklyAttendance?.absent || 0,
        Leave: course.weeklyAttendance?.leave || 0,
    }));

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

                {/* Main Feature Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6"
                >
                    <motion.div variants={item}>
                        <FeatureCard
                            title="My Courses"
                            description="Manage your courses, view student lists, and track progress."
                            icon={BookOpen}
                            color="text-emerald-400"
                            actionLabel="View Courses"
                            onClick={() => navigate('/teacher/courses')}
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <FeatureCard
                            title="Mark Attendance"
                            description="Quickly mark daily attendance for your active classes."
                            icon={CheckSquare}
                            color="text-blue-400"
                            actionLabel="Start Marking"
                            onClick={() => navigate('/teacher/attendance')}
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <FeatureCard
                            title="Leave Requests"
                            description="Review and approve pending student leave applications."
                            icon={FileText}
                            color="text-amber-400"
                            actionLabel="View Pending"
                            onClick={() => navigate('/teacher/leaves')}
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <FeatureCard
                            title="Weekly Summary"
                            description="Analyze attendance trends and student performance."
                            icon={BarChart}
                            color="text-purple-400"
                            actionLabel="View Report"
                            onClick={() => navigate('/teacher/summary')}
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <FeatureCard
                            title="Feedback"
                            description="View anonymous student feedback and aggregated ratings."
                            icon={MessageSquare}
                            color="text-cyan-400"
                            actionLabel="View Feedback"
                            onClick={() => navigate('/teacher/feedback')}
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <FeatureCard
                            title="Question Paper"
                            description="Create and generate question papers using AI."
                            icon={FileText}
                            color="text-pink-400"
                            actionLabel="Create Paper"
                            onClick={() => navigate('/teacher/question-paper/create')}
                        />
                    </motion.div>
                </motion.div>

                {/* Recent Activity / Quick Stats Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Attendance Overview Chart */}
                    <div className="lg:col-span-2 bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 min-h-[300px] flex flex-col">
                        <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                            <BarChart className="text-indigo-400" size={24} />
                            7-Day Attendance Overview
                        </h3>
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 size={32} className="animate-spin text-indigo-500" />
                            </div>
                        ) : chartData.length > 0 ? (
                            <div className="flex-1 min-h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart
                                        data={chartData}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="#94a3b8" 
                                            tick={{ fill: '#94a3b8' }} 
                                            axisLine={{ stroke: '#475569' }}
                                        />
                                        <YAxis 
                                            stroke="#94a3b8" 
                                            tick={{ fill: '#94a3b8' }} 
                                            axisLine={{ stroke: '#475569' }}
                                            tickLine={{ stroke: '#475569' }}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                            cursor={{ fill: 'rgba(51, 65, 85, 0.4)' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                        <Bar dataKey="Present" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                        <Bar dataKey="Leave" stackId="a" fill="#f59e0b" />
                                        <Bar dataKey="Absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                                <BarChart size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No attendance data for the last 7 days.</p>
                            </div>
                        )}
                    </div>

                    {/* Class Summaries (Recent Actions) */}
                    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 flex flex-col max-h-[400px]">
                        <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                            <BookOpen className="text-indigo-400" size={24} />
                            Class Status
                        </h3>
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 size={32} className="animate-spin text-indigo-500" />
                            </div>
                        ) : summaryData.length > 0 ? (
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                {summaryData.map(course => (
                                    <div key={course.courseId} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                        <h4 className="font-bold text-slate-200 truncate" title={course.courseName}>{course.courseName}</h4>
                                        <div className="mt-2 text-sm space-y-1">
                                            <div className="flex justify-between items-center text-slate-400">
                                                <span>Attendance Rate:</span>
                                                <span className={`font-semibold ${
                                                    course.weeklyAttendance.percentage >= 75 ? 'text-emerald-400' :
                                                    course.weeklyAttendance.percentage >= 60 ? 'text-amber-400' : 'text-rose-400'
                                                }`}>
                                                    {course.weeklyAttendance.percentage}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-slate-400">
                                                <span>Pending Leaves:</span>
                                                <span className={course.weeklyLeaves.pending > 0 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                                                    {course.weeklyLeaves.pending}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 mt-8">
                                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-center">No active courses found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default TeacherDashboard;
