import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import CourseCard from '../components/CourseCard';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import SkeletonCard from '../components/SkeletonCard';
import StudentActiveSessionCard from '../components/StudentActiveSessionCard';
import { LayoutDashboard, BookOpen, AlertCircle } from 'lucide-react';

// Stat Card Component
const StatCard = ({ label, value, subtext, icon, color }) => (
    <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
        <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-sm font-medium">{label}</span>
            {icon && <span className={`${color} opacity-80`}>{icon}</span>}
        </div>
        <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{value}</span>
            {subtext && <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${color} bg-opacity-10 mb-1`}>{subtext}</span>}
        </div>
    </div>
);

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            // 1. Fetch Enrolled Courses
            const coursesRes = await api.get('/academic/courses');
            let enrolledCourses = coursesRes.data;
            
            // Client-side Filter (if backend sends all)
            if (user && enrolledCourses.length > 0) {
                 enrolledCourses = enrolledCourses.filter(c => c.students.some(s => s._id === user._id || s === user._id));
            }

            // 2. Fetch Attendance for Each Course (Parallel Request)
            const coursesWithStats = await Promise.all(enrolledCourses.map(async (course) => {
                try {
                    const attRes = await api.get(`/attendance/course/${course._id}`);
                    const records = attRes.data || [];
                    
                    // Logic: Count 'Present'
                    const attended = records.filter(r => r.status === 'Present').length;
                    // Logic: Total is Present + Absent. 'Leave' is officially "Exempted" or counted?
                    // Usually Leave is Exempted from Denominator or counted as Present depending on policy.
                    // For MERN logic simplicity: Total = Present + Absent. Leave doesn't count against you.
                    const relevantRecords = records.filter(r => ['Present', 'Absent'].includes(r.status));
                    const total = relevantRecords.length;

                    return { ...course, attended, total };
                } catch (e) {
                    console.error(`Failed to get stats for ${course.name}`, e);
                    return { ...course, attended: 0, total: 0 };
                }
            }));

            setCourses(coursesWithStats);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchDashboardData();
    }, [user]);

    // Helper to calculate summary stats
    const calculateStats = () => {
        if (!courses.length) return { avg: 0, totalClasses: 0, bunkable: 0, critical: 0 };
        
        let totalPct = 0;
        let totalClasses = 0;
        let bunkable = 0;
        let critical = 0;
        let countedCourses = 0;

        courses.forEach(sub => {
            if (sub.total === 0) return; // Skip empty courses from Avg calculation? Or count as 0?
            
            countedCourses++;
            const pct = (sub.attended / sub.total) * 100;
            totalPct += pct;
            totalClasses += sub.total;
            
            const target = user?.attendanceRequirement || 75;
            if (pct >= target) {
                 const possibleTotal = sub.attended / (target / 100);
                 const safe = Math.floor(possibleTotal - sub.total);
                 if (safe > 0) bunkable += safe;
            } else {
                critical++;
            }
        });

        return {
            avg: countedCourses > 0 ? Math.round(totalPct / countedCourses) : 0,
            totalClasses,
            bunkable,
            critical
        };
    };

    const stats = calculateStats();

    // Animation Variants
    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
                         <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-1">
                            Hello, {user?.name || 'Student'}
                        </h1>
                         <p className="text-slate-400 flex items-center gap-2">
                            <LayoutDashboard size={18} />
                            Track your academic progress
                        </p>
                    </div>
                    {courses.length > 0 && (
                         <div className="text-right hidden md:block">
                             <span className="text-slate-400 text-sm">Aggregate</span>
                             <div className={`text-3xl font-bold ${stats.avg >= 75 ? "text-emerald-400" : "text-rose-400"}`}>
                                 {stats.avg}%
                             </div>
                        </div>
                    )}
                </header>

                {/* AI Attendance Section */}
                {courses.length > 0 && !loading && (
                    <div className="mb-8">
                        {courses.map(course => (
                            <StudentActiveSessionCard 
                                key={course._id} 
                                courseId={course._id} 
                                courseName={course.name} 
                            />
                        ))}
                    </div>
                )}

                {courses.length === 0 && !loading ? (
                    <div className="bg-slate-800/50 rounded-2xl p-12 text-center border border-slate-700 dashed-border">
                        <BookOpen size={48} className="mx-auto mb-4 text-slate-600" />
                        <h3 className="text-xl font-bold text-slate-300">No Courses Yet</h3>
                        <p className="text-slate-500 mt-2">You are not enrolled in any courses.</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard 
                                label="Avg Attendance" 
                                value={`${stats.avg}%`} 
                                subtext={stats.avg >= 75 ? "Good" : "Attention"}
                                color={stats.avg >= 75 ? "text-emerald-400 bg-emerald-400" : "text-rose-400 bg-rose-400"}
                            />
                            <StatCard 
                                label="Total Classes" 
                                value={stats.totalClasses} 
                                color="text-indigo-400"
                            />
                            <StatCard 
                                label="Safe Bunks" 
                                value={stats.bunkable} 
                                icon="🏖️"
                                color="text-emerald-400"
                            />
                            <StatCard 
                                label="Critical" 
                                value={stats.critical} 
                                icon="⚠️"
                                color="text-rose-400"
                            />
                        </div>

                        {/* Courses Grid */}
                        <section>
                            <h2 className="text-xl font-bold text-slate-100 mb-6">My Courses</h2>
                            
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                                </div>
                            ) : (
                                <motion.div 
                                    variants={container}
                                    initial="hidden"
                                    animate="show"
                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                >
                                    {courses.map((course) => (
                                        <motion.div key={course._id} variants={item}>
                                            <CourseCard 
                                                {...course}
                                                // No update/delete handlers passed as students can't modify
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </PageTransition>
    );
};

export default StudentDashboard;
