import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Hash, Users } from 'lucide-react';
import api from '../../api/axios';
import AuthContext from '../../context/AuthContext';
import PageTransition from '../../components/PageTransition';
import LeaderboardTable from '../../components/leaderboard/LeaderboardTable';
import { getPerformanceBadge } from '../../utils/percentile.util';

const StudentLeaderboardPage = () => {
    const { assessmentId } = useParams();
    const { user } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await api.get(`/leaderboard/assessment/${assessmentId}`);
                setData(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load leaderboard');
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [assessmentId]);

    if (loading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div></div>;
    if (error) return <div className="text-center p-12 text-rose-400">{error}</div>;
    if (!data) return null;

    const { assessment, leaderboard, myEntry, totalStudents } = data;
    const myPercentile = myEntry && totalStudents > 0
        ? parseFloat((((totalStudents - myEntry.rank + 1) / totalStudents) * 100).toFixed(1))
        : null;
    const badge = myPercentile != null ? getPerformanceBadge(myPercentile) : null;
    const isInTop10 = myEntry && leaderboard.some(e => e.studentId === myEntry.studentId);

    return (
        <PageTransition>
            <div className="space-y-6 pb-20">
                <header>
                    <Link to="/student/marks" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-3 transition-colors">
                        <ArrowLeft size={16} /> Back to Marks
                    </Link>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent mb-1 flex items-center gap-3">
                        <Trophy size={32} className="text-yellow-400" />
                        Assessment Leaderboard
                    </h1>
                    <p className="text-slate-400">
                        {assessment.title} — {assessment.course?.name}
                    </p>
                </header>

                {/* My Rank Card */}
                {myEntry && (
                    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 p-6">
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-500/20 rounded-xl">
                                    <Hash size={24} className="text-indigo-400" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 uppercase font-medium">Your Rank</div>
                                    <div className="text-3xl font-bold text-white">{myEntry.rank}</div>
                                </div>
                            </div>
                            <div className="h-12 w-px bg-slate-700 hidden sm:block" />
                            <div>
                                <div className="text-xs text-slate-400 uppercase font-medium">Your Score</div>
                                <div className="text-2xl font-bold text-slate-100">
                                    {myEntry.obtainedMarks} <span className="text-sm text-slate-500 font-normal">/ {assessment.maxMarks}</span>
                                </div>
                            </div>
                            <div className="h-12 w-px bg-slate-700 hidden sm:block" />
                            <div>
                                <div className="text-xs text-slate-400 uppercase font-medium">Out of</div>
                                <div className="text-2xl font-bold text-slate-300 flex items-center gap-2">
                                    <Users size={18} className="text-slate-500" />
                                    {totalStudents}
                                </div>
                            </div>
                            {badge && (
                                <>
                                    <div className="h-12 w-px bg-slate-700 hidden sm:block" />
                                    <span className={`text-sm px-3 py-1.5 rounded-full border font-medium ${badge.bg} ${badge.color}`}>
                                        {badge.label}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Top 10 Table */}
                <LeaderboardTable
                    leaderboard={leaderboard}
                    maxMarks={assessment.maxMarks}
                    highlightStudentId={user?._id}
                    label="Top 10"
                />

                {/* If student not in top 10, show their row separately */}
                {myEntry && !isInTop10 && (
                    <div className="mt-2">
                        <p className="text-xs text-slate-500 mb-2 uppercase font-medium">Your Position</p>
                        <LeaderboardTable
                            leaderboard={[myEntry]}
                            maxMarks={assessment.maxMarks}
                            highlightStudentId={user?._id}
                            label="Your Rank"
                        />
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default StudentLeaderboardPage;
