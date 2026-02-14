import React, { useState, useEffect } from 'react';
import { BarChart, BookOpen, Calendar, Award } from 'lucide-react';
import api from '../api/axios';
import PageTransition from '../components/PageTransition';

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
                                        const isPass = percentage >= 40; // Example threshold

                                        return (
                                            <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-slate-200">{assessment.title}</span>
                                                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400 capitalize">
                                                            {assessment.type}
                                                        </span>
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
