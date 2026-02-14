import React, { useState, useEffect, useContext } from 'react';
import { ArrowLeft, PieChart as PieIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';

import AnalyticsSummaryCards from '../components/marks/analytics/AnalyticsSummaryCards';
import ParticipationPieChart from '../components/marks/analytics/ParticipationPieChart';
import MarksDistributionChart from '../components/marks/analytics/MarksDistributionChart';

const MarksAnalyticsPage = () => {
    const { user } = useContext(AuthContext);
    const [assessments, setAssessments] = useState([]);
    const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch Assessments List
    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                const res = await api.get('/marks/assessment/teacher/all');
                setAssessments(res.data);
                if (res.data.length > 0) {
                    setSelectedAssessmentId(res.data[0]._id);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error("Failed to fetch assessments", err);
                setLoading(false);
            }
        };
        fetchAssessments();
    }, [user]);

    // Fetch Assessment Data when selected
    useEffect(() => {
        if (!selectedAssessmentId) return;

        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                // 1. Fetch Assessment Data & Marks
                const res = await api.get(`/marks/assessment/${selectedAssessmentId}`);
                const { assessment, marks } = res.data;

                // 2. Fetch Course Data for total students count
                let totalStudents = 0;
                if (assessment.course) {
                    // Check if course object is populated or just ID
                    const courseId = assessment.course._id || assessment.course;
                    const courseRes = await api.get(`/academic/courses/${courseId}`);
                    totalStudents = courseRes.data.students?.length || 0;
                }

                // 3. Compute Analytics
                const obtainedMarks = marks.map(m => m.obtainedMarks);
                const participatedCount = marks.length;

                const average = obtainedMarks.length > 0 
                    ? (obtainedMarks.reduce((a, b) => a + b, 0) / obtainedMarks.length).toFixed(1) 
                    : 0;
                
                const highest = obtainedMarks.length > 0 ? Math.max(...obtainedMarks) : 0;
                const lowest = obtainedMarks.length > 0 ? Math.min(...obtainedMarks) : 0;
                
                const participationParams = {
                    participated: participatedCount,
                    total: totalStudents,
                    percentage: totalStudents > 0 ? Math.round((participatedCount / totalStudents) * 100) : 0
                };

                setAnalyticsData({
                    assessment,
                    marks: obtainedMarks,
                    average,
                    highest,
                    lowest,
                    participationParams
                });

            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [selectedAssessmentId]);


    return (
        <PageTransition>
            <div className="space-y-8 pb-20">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link to="/teacher/marks" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-2 transition-colors">
                            <ArrowLeft size={16} /> Back to Marks
                        </Link>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-1 flex items-center gap-3">
                            Marks Analytics
                        </h1>
                        <p className="text-slate-400">
                            Insights into student performance and assessment distribution.
                        </p>
                    </div>

                    {/* Assessment Selector */}
                    <div className="w-full md:w-64">
                         <select
                            value={selectedAssessmentId}
                            onChange={(e) => setSelectedAssessmentId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none transition-colors cursor-pointer"
                        >
                            {assessments.map(a => (
                                <option key={a._id} value={a._id}>{a.title}</option>
                            ))}
                        </select>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
                    </div>
                ) : analyticsData ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Summary Cards */}
                        <AnalyticsSummaryCards analytics={analyticsData} />

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ParticipationPieChart 
                                participated={analyticsData.participationParams.participated} 
                                total={analyticsData.participationParams.total} 
                            />
                            <MarksDistributionChart 
                                marks={analyticsData.marks} 
                                maxMarks={analyticsData.assessment.maxMarks} 
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                        <PieIcon size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium mb-2">No Data Available</p>
                        <p className="text-slate-500">Select an assessment to view analytics.</p>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default MarksAnalyticsPage;
