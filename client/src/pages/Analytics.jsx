import React, { useState, useEffect, useContext } from 'react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Calculator, AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import moment from 'moment';

const Analytics = () => {
    const { user } = useContext(AuthContext);
    const [data, setData] = useState({ trend: [], subjects: [], heatmap: [], health: {} });
    const [loading, setLoading] = useState(true);

    // Simulator State
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [skipClasses, setSkipClasses] = useState(1);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/analytics/dashboard');
                setData(res.data);
                
                // If subjects exist, select first for simulator
                // Note: The structure of res.data.subjects for BarChart is {name, Attended, ...}
                // But simulator needs ID. We might need raw subjects or find ID from another call.
                // Actually, the previous version fetched /subjects. Let's keep a separate fetch for raw subjects for dropdown
                // OR update controller to send IDs in charts. Ideally separate.
                
                // Fetch raw subjects for dropdown (Simpler to keep this working)
                const subRes = await api.get('/subjects');
                if (subRes.data.length > 0) {
                    setSelectedSubjectId(subRes.data[0]._id);
                }
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- Simulator Logic ---
    const [rawSubjects, setRawSubjects] = useState([]);
    useEffect(() => {
        api.get('/subjects').then(res => setRawSubjects(res.data)).catch(console.error);
    }, []);

    const selectedSubject = rawSubjects.find(s => s._id === selectedSubjectId);
    let simResult = null;

    if (selectedSubject) {
        const currentAttended = selectedSubject.attended;
        const currentTotal = selectedSubject.total;
        const newTotal = currentTotal + parseInt(skipClasses);
        const newPercentage = Math.round((currentAttended / newTotal) * 100);
        
        const target = user?.attendanceRequirement || 75;
        const isSafe = newPercentage >= target;

        simResult = {
            newPercentage,
            isSafe,
            drop: Math.round((currentAttended / currentTotal) * 100) - newPercentage
        };
    }

    // --- Heatmap Generator ---
    const renderHeatmap = () => {
        const today = moment();
        const days = [];
        // Generate last 90 days (approx semester)
        for (let i = 89; i >= 0; i--) {
            const date = moment().subtract(i, 'days');
            const dateStr = date.format('YYYY-MM-DD');
            const log = data.heatmap.find(h => h.date === dateStr);
            const intensity = log ? Math.min(log.count, 4) : 0; // 0-4 scale
            
            // Color map
            const colors = [
                'bg-slate-800/50 border-slate-700/50', // 0
                'bg-emerald-900/40 border-emerald-800/50', // 1
                'bg-emerald-700/50 border-emerald-600/50', // 2
                'bg-emerald-500/60 border-emerald-400/50', // 3
                'bg-emerald-400 border-emerald-300' // 4 (Max)
            ];

            days.push(
                <div 
                    key={dateStr}
                    title={`${dateStr}: ${log ? log.count : 0} classes`}
                    className={`w-3 h-3 md:w-4 md:h-4 rounded-[2px] border ${colors[intensity]} transition-colors hover:border-white/50`}
                ></div>
            );
        }
        return days;
    };


    if (loading) return <div className="p-8 text-center text-slate-500">Loading analytics...</div>;

    return (
        <div className="space-y-8 pb-10">
            <header>
                 <h1 className="text-3xl font-bold text-white mb-2">Deep Analytics</h1>
                 <p className="text-slate-400">Real-time insights into your attendance habits.</p>
            </header>

            {/* Heatmap Section */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                     <span className="p-2 bg-orange-500/10 rounded-lg text-orange-400"><Flame size={18} /></span>
                     Attendance Heatmap (Last 90 Days)
                </h3>
                <div className="flex flex-wrap gap-1 justify-center md:justify-start">
                    {renderHeatmap()}
                </div>
                <div className="flex items-center gap-2 mt-4 text-xs text-slate-500 justify-end">
                    <span>Less</span>
                    <div className="w-3 h-3 bg-slate-800/50 border border-slate-700/50 rounded-[2px]"></div>
                    <div className="w-3 h-3 bg-emerald-900/40 border-emerald-800/50 rounded-[2px]"></div>
                    <div className="w-3 h-3 bg-emerald-500/60 border-emerald-400/50 rounded-[2px]"></div>
                    <div className="w-3 h-3 bg-emerald-400 border-emerald-300 rounded-[2px]"></div>
                    <span>More</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Visual Graphs (Spans 2 cols) */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Trend Chart */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                        <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                             <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                             Attendance Trend (Last 4 Weeks)
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.trend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="week" stroke="#94a3b8" tick={{fontSize: 12}} />
                                    <YAxis stroke="#94a3b8" tick={{fontSize: 12}} domain={[0, 100]} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                        itemStyle={{ color: '#818cf8' }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="attendance" 
                                        stroke="#818cf8" 
                                        strokeWidth={4} 
                                        dot={{ r: 4, fill: '#1e293b', strokeWidth: 2 }} 
                                        activeDot={{ r: 6, fill: '#818cf8' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Comparison Chart */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                        <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                             <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                             Subject Breakdown
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.subjects} barSize={20}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
                                    <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                                    <Tooltip 
                                         cursor={{fill: '#334155', opacity: 0.2}}
                                         contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Attended" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="Skipped" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* Right Column: Bunk Simulator */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sticky top-6 shadow-xl shadow-indigo-500/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                                <Calculator size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Bunk Simulator</h3>
                                <p className="text-xs text-slate-400">Predict the impact of future absences</p>
                            </div>
                        </div>

                        {rawSubjects.length > 0 ? (
                            <div className="space-y-6">
                                {/* Input 1: Subject Select */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Select Subject</label>
                                    <select 
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        value={selectedSubjectId}
                                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                                    >
                                        {rawSubjects.map(s => (
                                            <option key={s._id} value={s._id}>{s.name} ({Math.round(s.attended/s.total*100 || 0)}%)</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Input 2: Slider */}
                                <div>
                                    <label className="flex justify-between text-sm font-medium text-slate-400 mb-4">
                                        <span>Bunking Next</span>
                                        <span className="text-white font-bold">{skipClasses} Classes</span>
                                    </label>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="10" 
                                        step="1"
                                        value={skipClasses}
                                        onChange={(e) => setSkipClasses(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 mt-2 px-1">
                                        <span>1</span>
                                        <span>5</span>
                                        <span>10</span>
                                    </div>
                                </div>

                                {/* Output Result */}
                                {simResult && (
                                    <div className={`mt-6 p-4 rounded-xl border ${
                                        simResult.isSafe 
                                            ? 'bg-emerald-500/10 border-emerald-500/20' 
                                            : 'bg-rose-500/10 border-rose-500/20'
                                    }`}>
                                        <div className="flex items-start gap-3">
                                            {simResult.isSafe 
                                                ? <CheckCircle className="text-emerald-400 mt-1" size={20} />
                                                : <AlertTriangle className="text-rose-400 mt-1" size={20} />
                                            }
                                            <div>
                                                <h4 className={`font-bold ${simResult.isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {simResult.isSafe ? 'Go for it!' : 'CAUTION: RISK!'}
                                                </h4>
                                                <p className="text-sm text-slate-300 mt-1">
                                                    Your attendance will drop to <span className="font-bold text-white">{simResult.newPercentage}%</span>.
                                                    {simResult.drop > 0 && <span className="block text-xs text-slate-500 mt-1">(-{simResult.drop}% from current)</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 py-4">
                                No subjects available to simulate.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
