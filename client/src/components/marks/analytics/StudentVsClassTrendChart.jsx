import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const StudentVsClassTrendChart = ({ data, title }) => {
    // data expected: [{ name: 'Quiz 1', date: '...', studentPercentage: 72, classAveragePercentage: 65 }]

    if (!data || data.length < 2) {
        return (
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 h-full flex flex-col items-center justify-center text-center">
                <h3 className="text-lg font-bold text-slate-100 mb-2">{title}</h3>
                <p className="text-slate-500">Not enough data to show comparison trend.</p>
                <p className="text-xs text-slate-600 mt-1">Need at least 2 assessments.</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
                    <p className="font-bold text-slate-200 mb-1">{dataPoint.name}</p>
                    <p className="text-xs text-slate-400 mb-2">{new Date(dataPoint.date).toLocaleDateString()}</p>
                    <div className="space-y-1">
                        <p className="text-sm text-emerald-400 font-medium">
                            Student: {dataPoint.studentPercentage}%
                        </p>
                        <p className="text-sm text-indigo-400 font-medium">
                            Class Avg: {dataPoint.classAveragePercentage}%
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 h-full">
            <h3 className="text-lg font-bold text-slate-100 mb-6">{title}</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis
                            dataKey="name"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '5 5' }} />
                        <Legend verticalAlign="top" height={36} />

                        <Line
                            name="Student"
                            type="monotone"
                            dataKey="studentPercentage"
                            stroke="#10b981" // emerald-500
                            strokeWidth={3}
                            dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#1e293b' }}
                            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 0 }}
                            animationDuration={1500}
                        />
                        <Line
                            name="Class Average"
                            type="monotone"
                            dataKey="classAveragePercentage"
                            stroke="#6366f1" // indigo-500
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, stroke: '#6366f1', strokeWidth: 0 }}
                            animationDuration={1500}
                        />

                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default StudentVsClassTrendChart;
