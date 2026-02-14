import React, { useState, useEffect } from 'react';
import { BarChart, BookOpen, Calendar, Award, TrendingUp, ArrowUp, ArrowDown, Trophy } from 'lucide-react';
import api from '../api/axios';
import PageTransition from '../components/PageTransition';
import { Link } from 'react-router-dom';
import { getPerformanceBadge } from '../utils/percentile.util';

const StudentMarks = () => {
    const [marksData, setMarksData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMarks = async () => {
            try {
                const res = await api.get('/marks/my');
                setMarksData(res.data);
            } catch (err) {
                console.error("Failed to fetch marks", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMarks();
    }, []);

    if (loading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div></div>;

    return (
        <PageTransition>
            <div className="space-y-8 pb-20">
                <header>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                        My Academic Performance
                    </h1>
                    <p className="text-slate-400">
                        View your assessment scores across all courses.
                    </p>
                </header>

                {marksData.length === 0 ? (
                    <div className="text-center p-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                        <BarChart size={48} className="mx-auto mb-4 opacity-20 text-purple-400" />
                        <p className="text-slate-400">No marks recorded yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {marksData.map((courseData, index) => (
                            <div key={index} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-purple-500/30 transition-all">
                                <div className="p-5 border-b border-slate-700/50 bg-slate-800/80 flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                        <BookOpen size={20} />
                                    </div>
                                    <h3 className="font-bold text-slate-100">{courseData.courseName}</h3>
                                </div>
                                <div className="divide-y divide-slate-700/50">
                                    {courseData.assessments.map((assessment, i) => {
                                        const percentage = Math.round((assessment.obtained / assessment.max) * 100);
                                        const isPass = percentage >= 40;
                                        const badge = assessment.percentile != null ? getPerformanceBadge(assessment.percentile) : null;

                                        return (
                                            <div key={i} className="p-5 hover:bg-slate-800/30 transition-colors">
                                                {/* Top Row: Title + Score */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium text-slate-200">{assessment.title}</span>
                                                            <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400 capitalize">
                                                                {assessment.type}
                                                            </span>
                                                            {badge && (
                                                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge.bg} ${badge.color}`}>
                                                                    {badge.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <Calendar size={12} />
                                                            <span>{new Date(assessment.date).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-slate-100">
                                                            {assessment.obtained} <span className="text-sm text-slate-500 font-normal">/ {assessment.max}</span>
                                                        </div>
                                                        <div className={`text-xs font-medium ${isPass ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {percentage}%
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stats Row */}
                                                {assessment.totalStudents > 0 && (
                                                    <div className="flex flex-wrap gap-3 text-xs">
                                                        <div className="flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1.5 rounded-lg">
                                                            <span className="text-slate-500">Avg</span>
                                                            <span className="text-indigo-400 font-semibold">{assessment.classAverageMarks}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1.5 rounded-lg">
                                                            <ArrowUp size={12} className="text-emerald-400" />
                                                            <span className="text-slate-500">High</span>
                                                            <span className="text-emerald-400 font-semibold">{assessment.classHighest}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1.5 rounded-lg">
                                                            <ArrowDown size={12} className="text-rose-400" />
                                                            <span className="text-slate-500">Low</span>
                                                            <span className="text-rose-400 font-semibold">{assessment.classLowest}</span>
                                                        </div>
                                                        {assessment.percentile != null && (
                                                            <div className="flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1.5 rounded-lg">
                                                                <TrendingUp size={12} className="text-purple-400" />
                                                                <span className="text-slate-500">Percentile</span>
                                                                <span className="text-purple-400 font-semibold">{assessment.percentile}%</span>
                                                            </div>
                                                        )}
                                                        <Link
                                                            to={`/student/leaderboard/${assessment._id}`}
                                                            className="flex items-center gap-1.5 bg-yellow-500/10 px-2.5 py-1.5 rounded-lg text-yellow-400 hover:bg-yellow-500/20 transition-colors border border-yellow-500/20"
                                                        >
                                                            <Trophy size={12} />
                                                            <span className="font-medium">Leaderboard</span>
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default StudentMarks;

