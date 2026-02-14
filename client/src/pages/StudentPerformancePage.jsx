import React, { useState, useEffect, useContext } from 'react';
import { Search, User, TrendingUp } from 'lucide-react';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import MarksTrendChart from '../components/marks/analytics/MarksTrendChart';
import StudentVsClassTrendChart from '../components/marks/analytics/StudentVsClassTrendChart';

const StudentPerformancePage = () => {
    const { user } = useContext(AuthContext);
    
    // Selection state
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');

    // Data state
    const [performanceData, setPerformanceData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);

    // 1. Fetch Teacher's Courses
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('/academic/courses');
                // Filter client side as safety if generic endpoint
                const myCourses = res.data.filter(c => c.teacher?._id === user._id || c.teacher === user._id);
                setCourses(myCourses);
                if (myCourses.length > 0) setSelectedCourseId(myCourses[0]._id);
            } catch (err) {
                console.error("Failed to fetch courses", err);
            }
        };
        fetchCourses();
    }, [user]);

    // 2. Fetch Students when Course Selected
    useEffect(() => {
        if (!selectedCourseId) return;

        const fetchStudents = async () => {
            try {
                const res = await api.get(`/academic/courses/${selectedCourseId}`);
                const courseStudents = res.data.students || [];
                setStudents(courseStudents);
                setPerformanceData(null); // Reset chart
                setSelectedStudentId(''); // Reset student
            } catch (err) {
                console.error("Failed to fetch students", err);
            }
        };
        fetchStudents();
    }, [selectedCourseId]);

    // 3. Calculate Performance when Student Selected
    useEffect(() => {
        if (!selectedStudentId || !selectedCourseId) return;

        const calculatePerformance = async () => {
            setCalculating(true);
            try {
                // Determine course code/name for filtering
                const course = courses.find(c => c._id === selectedCourseId);

                // Fetch ALL assessments for teacher (already have API)
                // This is slightly inefficient but avoids backend changes. 
                // Better: fetch assessments by course ID if that API existed. 
                // Actually `getTeacherAssessments` returns all. 
                // We can filter by `selectedCourseId`
                const assessmentsRes = await api.get('/marks/assessment/teacher/all');
                const courseAssessments = assessmentsRes.data.filter(a => 
                    (a.course._id === selectedCourseId) || (a.course === selectedCourseId)
                );

                // Now fetch marks for EACH assessment to find this student's mark
                // Parallel requests
                const requests = courseAssessments.map(a => api.get(`/marks/assessment/${a._id}`));
                const responses = await Promise.all(requests);

                const trendData = [];
                const comparisonData = [];

                responses.forEach((res, index) => {
                    const { assessment, marks } = res.data;
                    const studentMark = marks.find(m => m.student._id === selectedStudentId);

                    if (studentMark) {
                        const max = assessment.maxMarks;
                        const obtained = studentMark.obtainedMarks;
                        const percentage = Math.round((obtained / max) * 100);
                        
                        // Calculate Class Average
                        const totalObtained = marks.reduce((sum, m) => sum + m.obtainedMarks, 0);
                        const avgObtained = marks.length > 0 ? (totalObtained / marks.length) : 0;
                        const classAvgPct = Math.round((avgObtained / max) * 100);

                        const dataPoint = {
                            name: assessment.title,
                            date: assessment.date,
                            obtained,
                            max,
                            percentage,
                            studentPercentage: percentage,
                            classAveragePercentage: classAvgPct
                        };

                        trendData.push(dataPoint);
                        comparisonData.push(dataPoint);
                    }
                });

                // Sort by date
                trendData.sort((a, b) => new Date(a.date) - new Date(b.date));
                comparisonData.sort((a, b) => new Date(a.date) - new Date(b.date));

                // Calculate Summary
                if (trendData.length > 0) {
                    const percentages = trendData.map(d => d.percentage);
                    const avg = (percentages.reduce((a,b) => a+b, 0) / percentages.length).toFixed(1);
                    const best = Math.max(...percentages);
                    const latest = percentages[percentages.length - 1];
                    const improvement = percentages.length > 1 ? (latest - percentages[0]) : 0;

                    setPerformanceData({
                        studentName: students.find(s => s._id === selectedStudentId)?.name,
                        trendData,
                        comparisonData,
                        summary: { avg, best, latest, improvement }
                    });
                } else {
                    setPerformanceData({ trendData: [], comparisonData: [] }); // Empty state
                }

            } catch (err) {
                console.error("Failed to calculate performance", err);
            } finally {
                setCalculating(false);
            }
        };

        calculatePerformance();
    }, [selectedStudentId]);

    return (
        <PageTransition>
            <div className="space-y-8 pb-20">
                <header>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent mb-1 flex items-center gap-3">
                        <TrendingUp size={32} className="text-orange-400" />
                        Student Performance Trends
                    </h1>
                    <p className="text-slate-400">
                        Analyze individual student progress across assessments.
                    </p>
                </header>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Select Course</label>
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none"
                        >
                            {courses.map(c => (
                                <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Select Student</label>
                        <select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            disabled={!selectedCourseId}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none disabled:opacity-50"
                        >
                            <option value="">Choose a student...</option>
                            {students.map(s => (
                                <option key={s._id} value={s._id}>{s.name} ({s.details?.studentId || "N/A"})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Content */}
                {calculating ? (
                   <div className="flex justify-center p-20">
                       <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500"></div>
                   </div> 
                ) : performanceData ? (
                    performanceData.trendData.length > 0 ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                             {/* Summary */}
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    <div className="text-xs text-slate-400 uppercase font-medium mb-1">Latest</div>
                                    <div className="text-2xl font-bold text-white">{performanceData.summary.latest}%</div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    <div className="text-xs text-slate-400 uppercase font-medium mb-1">Average</div>
                                    <div className="text-2xl font-bold text-indigo-400">{performanceData.summary.avg}%</div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    <div className="text-xs text-slate-400 uppercase font-medium mb-1">Best</div>
                                    <div className="text-2xl font-bold text-emerald-400">{performanceData.summary.best}%</div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    <div className="text-xs text-slate-400 uppercase font-medium mb-1">Trend</div>
                                    <div className={`text-2xl font-bold ${performanceData.summary.improvement >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {performanceData.summary.improvement > 0 ? '+' : ''}{performanceData.summary.improvement}%
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <MarksTrendChart 
                                    data={performanceData.trendData} 
                                    title={`Performance History: ${performanceData.studentName}`} 
                                    color="#fbbf24" // Amber
                                />
                                <StudentVsClassTrendChart
                                    data={performanceData.comparisonData}
                                    title="Student vs Class Average"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                            <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium mb-2">No Performance Data</p>
                            <p className="text-slate-500">This student has no marks recorded for this course yet.</p>
                        </div>
                    )
                ) : (
                    <div className="text-center p-12 opacity-50">
                        <User size={48} className="mx-auto mb-4" />
                        <p>Select a student to view their performance trend.</p>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default StudentPerformancePage;
