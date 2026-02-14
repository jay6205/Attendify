import React, { useState, useEffect, useContext } from 'react';
import { TrendingUp, Award, Target, BookOpen } from 'lucide-react';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import MarksTrendChart from '../components/marks/analytics/MarksTrendChart';
import StudentVsClassTrendChart from '../components/marks/analytics/StudentVsClassTrendChart';
import { buildStudentVsClassTrendData } from '../utils/marksAnalytics.util';

const MyPerformancePage = () => {
    const { user } = useContext(AuthContext);
    const [marksData, setMarksData] = useState([]); // [{ courseName, trendData: [], comparisonData: [], summary: {} }]
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMarks = async () => {
            try {
                const res = await api.get('/marks/my');

                // Transform data for charts per course
                const transformed = res.data.map(course => {
                    // Sort assessments by date
                    const sortedAssessments = [...course.assessments].sort((a, b) => new Date(a.date) - new Date(b.date));
                    
                    const trendData = sortedAssessments.map(a => ({
                        name: a.title,
                        date: a.date,
                        obtained: a.obtained,
                        max: a.max,
                        percentage: Math.round((a.obtained / a.max) * 100)
                    }));

                    // Comparison Data using Utility
                    const comparisonData = buildStudentVsClassTrendData(course.assessments);

                    // Calculate summary
                    const percentages = trendData.map(d => d.percentage);
                    const avg = percentages.length > 0 ? (percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(1) : 0;
                    const best = percentages.length > 0 ? Math.max(...percentages) : 0;
                    const latest = percentages.length > 0 ? percentages[percentages.length - 1] : 0;

                    const improvement = percentages.length >= 2 ? (percentages[percentages.length - 1] - percentages[0]) : 0;

                    return {
                        courseName: course.courseName,
                        trendData,
                        comparisonData,
                        summary: { avg, best, latest, improvement }
                    };
                });

                setMarksData(transformed);
            } catch (err) {
                console.error("Failed to fetch marks", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMarks();
    }, [user]);

    if (loading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div></div>;

    return (
        <PageTransition>
            <div className="space-y-8 pb-20">
                <header>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-1 flex items-center gap-3">
                        <TrendingUp size={32} className="text-emerald-400" />
                        My Performance Trends
                    </h1>
                    <p className="text-slate-400">
                        Track your improvement over time across all courses.
                    </p>
                </header>

                {marksData.length === 0 ? (
                    <div className="text-center p-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                        <Target size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-slate-400">No marks recorded yet.</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {marksData.map((course, index) => (
                            <div key={index} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                        <BookOpen size={24} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-100">{course.courseName}</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                                        <div className="text-xs text-slate-400 uppercase font-medium mb-1">Latest</div>
                                        <div className="text-2xl font-bold text-white">{course.summary.latest}%</div>
                                    </div>
                                    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                                        <div className="text-xs text-slate-400 uppercase font-medium mb-1">Average</div>
                                        <div className="text-2xl font-bold text-indigo-400">{course.summary.avg}%</div>
                                    </div>
                                    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                                        <div className="text-xs text-slate-400 uppercase font-medium mb-1">Best</div>
                                        <div className="text-2xl font-bold text-emerald-400">{course.summary.best}%</div>
                                    </div>
                                    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                                        <div className="text-xs text-slate-400 uppercase font-medium mb-1">Trend</div>
                                        <div className={`text-2xl font-bold ${course.summary.improvement >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {course.summary.improvement > 0 ? '+' : ''}{course.summary.improvement}%
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <MarksTrendChart
                                        data={course.trendData}
                                        title="My Progress Over Time"
                                        color="#6366f1"
                                    />
                                    <StudentVsClassTrendChart
                                        data={course.comparisonData}
                                        title="Me vs Class Average"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageTransition >
    );
};

export default MyPerformancePage;
