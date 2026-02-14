import React from 'react';
import { TrendingUp, Users, Award, BarChart2 } from 'lucide-react';

const SummaryCard = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 relative overflow-hidden group hover:border-slate-600 transition-all">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon size={64} />
        </div>
        <div className="relative z-10">
            <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
            <div className="text-2xl font-bold text-slate-100 mb-1">{value}</div>
            <p className="text-xs text-slate-500">{subtext}</p>
        </div>
    </div>
);

const AnalyticsSummaryCards = ({ analytics }) => {
    const { average, highest, lowest, participationParams } = analytics;
    const { participated, total, percentage } = participationParams;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SummaryCard 
                title="Average Marks" 
                value={average} 
                subtext="Class Average" 
                icon={BarChart2} 
                color="text-indigo-400" 
            />
            <SummaryCard 
                title="Participation" 
                value={`${percentage}%`} 
                subtext={`${participated} / ${total} Students`} 
                icon={Users} 
                color="text-blue-400" 
            />
            <SummaryCard 
                title="Highest Score" 
                value={highest} 
                subtext="Top Performer" 
                icon={Award} 
                color="text-emerald-400" 
            />
            <SummaryCard 
                title="Lowest Score" 
                value={lowest} 
                subtext="Needs Improvement" 
                icon={TrendingUp} 
                color="text-rose-400" 
            />
        </div>
    );
};

export default AnalyticsSummaryCards;
