import React, { useState, useEffect, useContext, useMemo } from 'react';
import { BarChart3, Users, TrendingUp, GraduationCap, BookOpen, Search, ChevronRight, Award, Clock, UserCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import MarksTrendChart from '../components/marks/analytics/MarksTrendChart';
import StudentVsClassTrendChart from '../components/marks/analytics/StudentVsClassTrendChart';

const TABS = [
    { id: 'institute', label: 'Institute Overview', icon: GraduationCap },
    { id: 'class', label: 'Class Performance', icon: BookOpen },
    { id: 'student', label: 'Student Drill-down', icon: Users }
];

const GRADE_COLORS = {
    excellent: '#10b981',  // emerald
    good: '#6366f1',       // indigo
    average: '#f59e0b',    // amber
    poor: '#ef4444'        // red
};

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b'];

const getGradeColor = (pct) => {
    if (pct >= 75) return GRADE_COLORS.excellent;
    if (pct >= 60) return GRADE_COLORS.good;
    if (pct >= 40) return GRADE_COLORS.average;
    return GRADE_COLORS.poor;
};

const getGradeLabel = (pct) => {
    if (pct >= 75) return 'Excellent';
    if (pct >= 60) return 'Good';
    if (pct >= 40) return 'Average';
    return 'Needs Improvement';
};

// ─── Stat Card ──────────────────────────────
const StatCard = ({ icon: Icon, label, value, subtitle, color = 'indigo' }) => {
    const colorMap = {
        indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-400',
        emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
        amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
        rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    };

    return (
        <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]`}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-slate-800/50`}>
                    <Icon size={18} className={colorMap[color].split(' ').pop()} />
                </div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
        </div>
    );
};

// ─── Tab Button ─────────────────────────────
const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 text-sm whitespace-nowrap ${
            active
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`}
    >
        <Icon size={16} />
        <span className="hidden sm:inline">{label}</span>
    </button>
);

// ─── Custom Bar Tooltip ─────────────────────
const BarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
                <p className="font-bold text-slate-200 mb-1 capitalize">{label}</p>
                <p className="text-sm text-indigo-400">{payload[0].value}% avg</p>
                <p className="text-xs text-slate-400">{payload[0].payload.count} entries</p>
            </div>
        );
    }
    return null;
};

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════
const AdminStudentPerformancePage = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('institute');

    // ─── INSTITUTE state ─────────────────────
    const [instituteData, setInstituteData] = useState(null);
    const [instituteLoading, setInstituteLoading] = useState(false);

    // ─── CLASS state ─────────────────────────
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [classData, setClassData] = useState(null);
    const [classLoading, setClassLoading] = useState(false);
    const [classSearch, setClassSearch] = useState('');

    // ─── STUDENT state ───────────────────────
    const [allStudents, setAllStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [studentCourseId, setStudentCourseId] = useState('');
    const [studentData, setStudentData] = useState(null);
    const [studentLoading, setStudentLoading] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');

    // ═════ FETCH INSTITUTE DATA ═════
    useEffect(() => {
        if (activeTab !== 'institute') return;
        if (instituteData) return; // Cache

        const fetchInstitute = async () => {
            setInstituteLoading(true);
            try {
                const res = await api.get('/admin/performance/institute');
                setInstituteData(res.data);

                // Also extract courses list for other tabs
                if (res.data.coursePerformance?.length > 0) {
                    setCourses(res.data.coursePerformance.map(c => ({
                        _id: c.courseId,
                        name: c.courseName,
                        code: c.courseCode
                    })));
                }
            } catch (err) {
                console.error('Failed to fetch institute data', err);
            } finally {
                setInstituteLoading(false);
            }
        };
        fetchInstitute();
    }, [activeTab]);

    // ═════ FETCH COURSES (if not from institute) ═════
    useEffect(() => {
        if (courses.length > 0) return;

        const fetchCourses = async () => {
            try {
                const res = await api.get('/academic/courses');
                setCourses(res.data.map(c => ({ _id: c._id, name: c.name, code: c.code })));
            } catch (err) {
                console.error('Failed to fetch courses', err);
            }
        };
        fetchCourses();
    }, []);

    // ═════ FETCH ALL STUDENTS ═════
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get('/admin/students');
                setAllStudents(res.data || []);
            } catch (err) {
                console.error('Failed to fetch students', err);
            }
        };
        fetchStudents();
    }, []);

    // ═════ FETCH CLASS DATA ═════
    useEffect(() => {
        if (!selectedCourseId || activeTab !== 'class') return;

        const fetchClassPerformance = async () => {
            setClassLoading(true);
            try {
                const res = await api.get(`/admin/performance/courses/${selectedCourseId}`);
                setClassData(res.data);
            } catch (err) {
                console.error('Failed to fetch class performance', err);
            } finally {
                setClassLoading(false);
            }
        };
        fetchClassPerformance();
    }, [selectedCourseId, activeTab]);

    // ═════ FETCH STUDENT DATA ═════
    useEffect(() => {
        if (!selectedStudentId || activeTab !== 'student') return;

        const fetchStudentPerformance = async () => {
            setStudentLoading(true);
            try {
                const url = studentCourseId
                    ? `/admin/performance/students/${selectedStudentId}?courseId=${studentCourseId}`
                    : `/admin/performance/students/${selectedStudentId}`;
                const res = await api.get(url);
                setStudentData(res.data);
            } catch (err) {
                console.error('Failed to fetch student performance', err);
            } finally {
                setStudentLoading(false);
            }
        };
        fetchStudentPerformance();
    }, [selectedStudentId, studentCourseId, activeTab]);

    // Filtered students for search
    const filteredStudents = useMemo(() => {
        if (!studentSearch.trim()) return allStudents;
        const q = studentSearch.toLowerCase();
        return allStudents.filter(s =>
            s.name?.toLowerCase().includes(q) ||
            s.details?.studentId?.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q)
        );
    }, [allStudents, studentSearch]);

    // ═════ RENDER HELPERS ═════
    const Spinner = () => (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
        </div>
    );

    const EmptyState = ({ icon: Icon, message, sub }) => (
        <div className="text-center py-16 opacity-60">
            <Icon size={48} className="mx-auto mb-4" />
            <p className="text-lg font-medium mb-1">{message}</p>
            {sub && <p className="text-sm text-slate-500">{sub}</p>}
        </div>
    );

    // ══════════════════════════════════════════
    // TAB 1: INSTITUTE OVERVIEW
    // ══════════════════════════════════════════
    const renderInstitute = () => {
        if (instituteLoading) return <Spinner />;
        if (!instituteData) return <EmptyState icon={GraduationCap} message="No data available" sub="Performance data will appear once assessments are created." />;

        const { overview, examTypeBreakdown, coursePerformance, attendanceSummary } = instituteData;

        const examChartData = examTypeBreakdown.map(e => ({
            name: e.examType.charAt(0).toUpperCase() + e.examType.slice(1),
            avgPercentage: e.avgPercentage,
            count: e.count
        }));

        const attendancePieData = [
            { name: 'Present', value: attendanceSummary.Present },
            { name: 'Absent', value: attendanceSummary.Absent },
            { name: 'Leave', value: attendanceSummary.Leave }
        ].filter(d => d.value > 0);

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Users} label="Total Students" value={overview.totalStudents} color="indigo" />
                    <StatCard icon={TrendingUp} label="Avg Score" value={`${overview.avgPercentage}%`} subtitle={getGradeLabel(overview.avgPercentage)} color="emerald" />
                    <StatCard icon={Award} label="Pass Rate" value={`${overview.passRate}%`} subtitle="≥ 40% threshold" color="amber" />
                    <StatCard icon={UserCheck} label="Attendance" value={`${overview.attendanceRate}%`} subtitle={`${attendanceSummary.total} records`} color="purple" />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Exam Type Breakdown */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                        <h3 className="text-lg font-bold text-slate-100 mb-6">Performance by Exam Type</h3>
                        {examChartData.length > 0 ? (
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={examChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                        <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
                                        <Bar dataKey="avgPercentage" radius={[8, 8, 0, 0]} animationDuration={1500}>
                                            {examChartData.map((entry, index) => (
                                                <Cell key={index} fill={getGradeColor(entry.avgPercentage)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-10">No assessment data yet</p>
                        )}
                    </div>

                    {/* Attendance Pie */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                        <h3 className="text-lg font-bold text-slate-100 mb-6">Attendance Distribution</h3>
                        {attendancePieData.length > 0 ? (
                            <div className="h-[280px] flex items-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={attendancePieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={4}
                                            dataKey="value"
                                            animationDuration={1500}
                                        >
                                            {attendancePieData.map((_, index) => (
                                                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload?.length) {
                                                    return (
                                                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
                                                            <p className="font-medium text-slate-200">{payload[0].name}</p>
                                                            <p className="text-sm text-indigo-400">{payload[0].value} records</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-3 ml-4 min-w-[120px]">
                                    {attendancePieData.map((entry, i) => (
                                        <div key={entry.name} className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }}></div>
                                            <span className="text-sm text-slate-300">{entry.name}</span>
                                            <span className="text-xs text-slate-500 ml-auto">{entry.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-10">No attendance data yet</p>
                        )}
                    </div>
                </div>

                {/* Course Performance Table */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-700/50">
                        <h3 className="text-lg font-bold text-slate-100">Course-wise Performance</h3>
                        <p className="text-sm text-slate-400 mt-1">Click on a course to view detailed class performance</p>
                    </div>
                    {coursePerformance.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-900/50">
                                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Course</th>
                                        <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Students</th>
                                        <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Avg Score</th>
                                        <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Pass Rate</th>
                                        <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Grade</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coursePerformance.map(course => (
                                        <tr
                                            key={course.courseId}
                                            onClick={() => { setSelectedCourseId(course.courseId); setActiveTab('class'); }}
                                            className="border-t border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-200">{course.courseName}</div>
                                                <div className="text-xs text-slate-500">{course.courseCode}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center text-slate-300">{course.studentCount}</td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="font-semibold" style={{ color: getGradeColor(course.avgPercentage) }}>
                                                    {course.avgPercentage}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center text-slate-300">{course.passRate}%</td>
                                            <td className="px-4 py-4 text-center">
                                                <span
                                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                                                    style={{
                                                        backgroundColor: getGradeColor(course.avgPercentage) + '20',
                                                        color: getGradeColor(course.avgPercentage)
                                                    }}
                                                >
                                                    {getGradeLabel(course.avgPercentage)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <ChevronRight size={16} className="text-slate-600" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-500">No course data available</div>
                    )}
                </div>
            </div>
        );
    };

    // ══════════════════════════════════════════
    // TAB 2: CLASS PERFORMANCE
    // ══════════════════════════════════════════
    const renderClass = () => {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Course Selector */}
                <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Select Course</label>
                    <select
                        value={selectedCourseId}
                        onChange={(e) => { setSelectedCourseId(e.target.value); setClassData(null); }}
                        className="w-full md:w-96 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none"
                    >
                        <option value="">Choose a course...</option>
                        {courses.map(c => (
                            <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                        ))}
                    </select>
                </div>

                {classLoading ? <Spinner /> : classData ? (
                    <>
                        {/* Course Info Header */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard icon={BookOpen} label="Course" value={classData.course.code} subtitle={classData.course.name} color="indigo" />
                            <StatCard icon={Users} label="Students" value={classData.course.studentCount} color="emerald" />
                            <StatCard icon={Award} label="Assessments" value={classData.assessments.length} color="amber" />
                            <StatCard icon={UserCheck} label="Attendance" value={
                                (() => {
                                    const s = classData.attendanceSummary;
                                    const total = s.Present + s.Absent + s.Leave;
                                    return total > 0 ? `${Math.round((s.Present / total) * 100)}%` : 'N/A';
                                })()
                            } subtitle={`${classData.attendanceSummary.Present + classData.attendanceSummary.Absent + classData.attendanceSummary.Leave} records`} color="purple" />
                        </div>

                        {/* Assessment Breakdown */}
                        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                            <div className="p-6 border-b border-slate-700/50">
                                <h3 className="text-lg font-bold text-slate-100">Assessment Breakdown</h3>
                            </div>
                            {classData.assessments.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-900/50">
                                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Assessment</th>
                                                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Type</th>
                                                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Max Marks</th>
                                                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Class Avg</th>
                                                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Highest</th>
                                                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Lowest</th>
                                                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Appeared</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {classData.assessments.map(a => (
                                                <tr key={a.assessmentId} className="border-t border-slate-700/30 hover:bg-slate-700/10 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-200">{a.title}</div>
                                                        <div className="text-xs text-slate-500">{new Date(a.date).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-700/50 text-slate-300 capitalize">
                                                            {a.examType}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center text-slate-300">{a.maxMarks}</td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="font-semibold" style={{ color: getGradeColor(a.avgPercentage) }}>
                                                            {a.avgPercentage}%
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center text-emerald-400 font-medium">{a.highest}</td>
                                                    <td className="px-4 py-4 text-center text-rose-400 font-medium">{a.lowest}</td>
                                                    <td className="px-4 py-4 text-center text-slate-300">{a.studentCount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-12 text-center text-slate-500">No assessments found</div>
                            )}
                        </div>

                        {/* Student Ranking */}
                        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                            <div className="p-6 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <h3 className="text-lg font-bold text-slate-100">Student Rankings</h3>
                                <div className="relative w-full md:w-64">
                                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search students..."
                                        value={classSearch}
                                        onChange={(e) => setClassSearch(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            {classData.students.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-900/50">
                                                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase w-12">#</th>
                                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Student</th>
                                                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Avg Score</th>
                                                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Assessments</th>
                                                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Grade</th>
                                                <th className="px-4 py-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {classData.students
                                                .filter(s => !classSearch || s.name?.toLowerCase().includes(classSearch.toLowerCase()) || s.rollNo?.toLowerCase().includes(classSearch.toLowerCase()))
                                                .map((student, idx) => (
                                                    <tr
                                                        key={student.studentId}
                                                        onClick={() => { setSelectedStudentId(student.studentId); setActiveTab('student'); }}
                                                        className="border-t border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors"
                                                    >
                                                        <td className="px-4 py-4 text-center">
                                                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                                                idx < 3 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-400'
                                                            }`}>
                                                                {idx + 1}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-slate-200">{student.name}</div>
                                                            <div className="text-xs text-slate-500">{student.rollNo}</div>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="font-semibold" style={{ color: getGradeColor(student.avgPercentage) }}>
                                                                {student.avgPercentage}%
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-center text-slate-300">{student.assessmentCount}</td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span
                                                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                                                                style={{
                                                                    backgroundColor: getGradeColor(student.avgPercentage) + '20',
                                                                    color: getGradeColor(student.avgPercentage)
                                                                }}
                                                            >
                                                                {getGradeLabel(student.avgPercentage)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <ChevronRight size={16} className="text-slate-600" />
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-12 text-center text-slate-500">No student marks data</div>
                            )}
                        </div>
                    </>
                ) : selectedCourseId ? (
                    <EmptyState icon={BookOpen} message="No performance data" sub="No marks have been recorded for this course yet." />
                ) : (
                    <EmptyState icon={BookOpen} message="Select a course" sub="Choose a course above to view class performance." />
                )}
            </div>
        );
    };

    // ══════════════════════════════════════════
    // TAB 3: STUDENT DRILL-DOWN
    // ══════════════════════════════════════════
    const renderStudent = () => {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Student Selector */}
                <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Search & Select Student</label>
                            <div className="relative mb-2">
                                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search by name, ID, or email..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <select
                                value={selectedStudentId}
                                onChange={(e) => { setSelectedStudentId(e.target.value); setStudentData(null); }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none"
                            >
                                <option value="">Choose a student...</option>
                                {filteredStudents.map(s => (
                                    <option key={s._id} value={s._id}>{s.name} ({s.details?.studentId || s.email})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Filter by Course (Optional)</label>
                            <select
                                value={studentCourseId}
                                onChange={(e) => { setStudentCourseId(e.target.value); setStudentData(null); }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none mt-[calc(0.5rem+42px)]"
                            >
                                <option value="">All courses</option>
                                {(studentData?.enrolledCourses || courses).map(c => (
                                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {studentLoading ? <Spinner /> : studentData ? (
                    <>
                        {/* Student Info + Summary */}
                        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                    {studentData.student.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100">{studentData.student.name}</h3>
                                    <p className="text-sm text-slate-400">
                                        {studentData.student.studentId !== 'N/A' ? `ID: ${studentData.student.studentId}` : studentData.student.email}
                                        {studentData.student.batch !== 'N/A' && ` · Batch: ${studentData.student.batch}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {studentData.summary ? (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <StatCard icon={Clock} label="Latest" value={`${studentData.summary.latest}%`} color="indigo" />
                                    <StatCard icon={TrendingUp} label="Average" value={`${studentData.summary.avg}%`} subtitle={getGradeLabel(studentData.summary.avg)} color="emerald" />
                                    <StatCard icon={Award} label="Best" value={`${studentData.summary.best}%`} color="amber" />
                                    <StatCard
                                        icon={TrendingUp}
                                        label="Improvement"
                                        value={`${studentData.summary.improvement > 0 ? '+' : ''}${studentData.summary.improvement}%`}
                                        color={studentData.summary.improvement >= 0 ? 'emerald' : 'rose'}
                                    />
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <MarksTrendChart
                                        data={studentData.trendData}
                                        title={`Performance History: ${studentData.student.name}`}
                                        color="#fbbf24"
                                    />
                                    <StudentVsClassTrendChart
                                        data={studentData.comparisonData}
                                        title="Student vs Class Average"
                                    />
                                </div>

                                {/* Course-wise Attendance */}
                                {studentData.courseAttendance?.length > 0 && (
                                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                                        <div className="p-6 border-b border-slate-700/50">
                                            <h3 className="text-lg font-bold text-slate-100">Course-wise Attendance</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-slate-900/50">
                                                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Course</th>
                                                        <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Present</th>
                                                        <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Absent</th>
                                                        <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Leave</th>
                                                        <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">Rate</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {studentData.courseAttendance.map(ca => (
                                                        <tr key={ca.courseId} className="border-t border-slate-700/30 hover:bg-slate-700/10 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="font-medium text-slate-200">{ca.courseName}</div>
                                                                <div className="text-xs text-slate-500">{ca.courseCode}</div>
                                                            </td>
                                                            <td className="px-4 py-4 text-center text-emerald-400 font-medium">{ca.present}</td>
                                                            <td className="px-4 py-4 text-center text-rose-400 font-medium">{ca.absent}</td>
                                                            <td className="px-4 py-4 text-center text-amber-400 font-medium">{ca.leave}</td>
                                                            <td className="px-4 py-4 text-center">
                                                                <span className="font-semibold" style={{ color: getGradeColor(ca.attendanceRate) }}>
                                                                    {ca.attendanceRate}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <EmptyState icon={TrendingUp} message="No Performance Data" sub="This student has no marks recorded yet." />
                        )}
                    </>
                ) : selectedStudentId ? (
                    <EmptyState icon={Users} message="Loading..." />
                ) : (
                    <EmptyState icon={Users} message="Select a student" sub="Choose a student above to view their performance." />
                )}
            </div>
        );
    };

    // ═════ MAIN RENDER ═════
    return (
        <PageTransition>
            <div className="space-y-8 pb-20">
                <header>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-1 flex items-center gap-3">
                        <BarChart3 size={32} className="text-indigo-400" />
                        Student Performance Analytics
                    </h1>
                    <p className="text-slate-400">
                        Comprehensive institute, class, and individual student performance insights.
                    </p>
                </header>

                {/* Tab Bar */}
                <div className="flex gap-2 bg-slate-800/30 p-2 rounded-xl border border-slate-700/50 overflow-x-auto">
                    {TABS.map(tab => (
                        <TabButton
                            key={tab.id}
                            id={tab.id}
                            label={tab.label}
                            icon={tab.icon}
                            active={activeTab === tab.id}
                            onClick={setActiveTab}
                        />
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'institute' && renderInstitute()}
                {activeTab === 'class' && renderClass()}
                {activeTab === 'student' && renderStudent()}
            </div>
        </PageTransition>
    );
};

export default AdminStudentPerformancePage;
