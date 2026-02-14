import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ParticipationPieChart = ({ participated, total }) => {
    const notParticipated = total - participated;

    const data = [
        { name: 'Participated', value: participated },
        { name: 'Pending', value: notParticipated },
    ];

    const COLORS = ['#6366f1', '#334155']; // Indigo-500, Slate-700

    if (total === 0) return <div className="text-center text-slate-500 py-10">No students enrolled</div>;

    return (
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 h-full">
            <h3 className="text-lg font-bold text-slate-100 mb-6">Participation Rate</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                            itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ParticipationPieChart;
