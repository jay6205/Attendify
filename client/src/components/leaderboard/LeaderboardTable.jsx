import React from 'react';
import { Trophy, Medal, Award, ArrowUp, ArrowDown, Minus, Sparkles } from 'lucide-react';

const rankIcon = (rank) => {
    if (rank === 1) return <Trophy size={16} className="text-yellow-400" />;
    if (rank === 2) return <Medal size={16} className="text-slate-300" />;
    if (rank === 3) return <Medal size={16} className="text-amber-600" />;
    return null;
};

const rankBg = (rank) => {
    if (rank === 1) return 'bg-yellow-500/5 border-yellow-500/20';
    if (rank === 2) return 'bg-slate-400/5 border-slate-400/20';
    if (rank === 3) return 'bg-amber-600/5 border-amber-600/20';
    return 'border-transparent';
};

const RankChangeIndicator = ({ rankChange }) => {
    if (!rankChange) return <span className="text-slate-600">—</span>;

    const { status, changeValue } = rankChange;

    if (status === 'UP') {
        return (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <ArrowUp size={14} />
                <span>{changeValue}</span>
            </span>
        );
    }
    if (status === 'DOWN') {
        return (
            <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                <ArrowDown size={14} />
                <span>{changeValue}</span>
            </span>
        );
    }
    if (status === 'NEW') {
        return (
            <span className="inline-flex items-center gap-1 text-blue-400 font-medium text-xs">
                <Sparkles size={12} />
                <span>NEW</span>
            </span>
        );
    }
    // SAME
    return (
        <span className="inline-flex items-center text-slate-500">
            <Minus size={14} />
        </span>
    );
};

const LeaderboardTable = ({ leaderboard, maxMarks, highlightStudentId, label = 'Leaderboard' }) => {
    if (!leaderboard || leaderboard.length === 0) {
        return (
            <div className="text-center p-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <Award size={48} className="mx-auto mb-4 opacity-20 text-indigo-400" />
                <p className="text-slate-400">No marks recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-5 border-b border-slate-700/50 bg-slate-800/80 flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Trophy size={20} />
                </div>
                <h3 className="font-bold text-slate-100">{label}</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-700/50">
                            <th className="text-left px-5 py-3 text-slate-400 font-medium w-20">Rank</th>
                            <th className="text-left px-5 py-3 text-slate-400 font-medium">Student</th>
                            <th className="text-right px-5 py-3 text-slate-400 font-medium w-32">Marks</th>
                            <th className="text-center px-5 py-3 text-slate-400 font-medium w-24">Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((entry, i) => {
                            const isHighlighted = highlightStudentId && entry.studentId?.toString() === highlightStudentId?.toString();
                            const percentage = maxMarks > 0 ? Math.round((entry.obtainedMarks / maxMarks) * 100) : 0;

                            return (
                                <tr
                                    key={entry.studentId + '-' + i}
                                    className={`border-b border-slate-700/30 transition-colors ${
                                        isHighlighted
                                            ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500'
                                            : `hover:bg-slate-800/30 ${rankBg(entry.rank)}`
                                    }`}
                                >
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            {rankIcon(entry.rank)}
                                            <span className={`font-bold ${
                                                entry.rank <= 3 ? 'text-slate-100' : 'text-slate-400'
                                            }`}>
                                                #{entry.rank}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div>
                                            <span className={`font-medium ${isHighlighted ? 'text-indigo-300' : 'text-slate-200'}`}>
                                                {entry.name}
                                                {isHighlighted && (
                                                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                                        You
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <span className="font-bold text-slate-100">{entry.obtainedMarks}</span>
                                        <span className="text-slate-500 text-xs ml-1">/ {maxMarks}</span>
                                        <span className={`ml-2 text-xs font-medium ${
                                            percentage >= 75 ? 'text-emerald-400' :
                                            percentage >= 40 ? 'text-amber-400' : 'text-rose-400'
                                        }`}>
                                            {percentage}%
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-center">
                                        <RankChangeIndicator rankChange={entry.rankChange} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeaderboardTable;
