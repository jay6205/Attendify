import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Search, Users } from 'lucide-react';
import api from '../../api/axios';
import PageTransition from '../../components/PageTransition';
import LeaderboardTable from '../../components/leaderboard/LeaderboardTable';

const TeacherLeaderboardPage = () => {
    const { assessmentId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

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

    const { assessment, leaderboard, totalStudents } = data;

    const filtered = searchTerm
        ? leaderboard.filter(e =>
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : leaderboard;

    return (
        <PageTransition>
            <div className="space-y-6 pb-20">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link to="/teacher/marks" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-3 transition-colors">
                            <ArrowLeft size={16} /> Back to Marks
                        </Link>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent mb-1 flex items-center gap-3">
                            <Trophy size={32} className="text-yellow-400" />
                            Leaderboard
                        </h1>
                        <p className="text-slate-400">
                            {assessment.title} — {assessment.course?.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                        <Users size={16} />
                        <span>{totalStudents} students</span>
                    </div>
                </header>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search by student name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>

                {/* Full Leaderboard */}
                <LeaderboardTable
                    leaderboard={filtered}
                    maxMarks={assessment.maxMarks}
                    label={searchTerm ? `Results for "${searchTerm}"` : 'Full Leaderboard'}
                />
            </div>
        </PageTransition>
    );
};

export default TeacherLeaderboardPage;
