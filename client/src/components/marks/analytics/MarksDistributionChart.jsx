import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MarksDistributionChart = ({ marks, maxMarks }) => {

    // Create buckets based on maxMarks
    // Strategy: 5 buckets. e.g. if max 100: 0-20, 21-40, 41-60, 61-80, 81-100
    // If max 20: 0-4, 5-8, 9-12, 13-16, 17-20

    const bucketCount = 5;
    const bucketSize = maxMarks / bucketCount;

    const buckets = Array.from({ length: bucketCount }, (_, i) => {
        const start = Math.floor(i * bucketSize);
        const end = i === bucketCount - 1 ? maxMarks : Math.floor((i + 1) * bucketSize) - 1;
        return {
            name: `${start}-${end}`,
            range: [start, end],
            count: 0
        };
    });

    marks.forEach(mark => {
        const bucket = buckets.find(b => mark >= b.range[0] && mark <= b.range[1]);
        if (bucket) bucket.count++;
    });

    return (
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 h-full">
            <h3 className="text-lg font-bold text-slate-100 mb-6">Marks Distribution</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={buckets}>
                        <XAxis
                            dataKey="name"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {buckets.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#818cf8" /> // Indigo-400
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MarksDistributionChart;
