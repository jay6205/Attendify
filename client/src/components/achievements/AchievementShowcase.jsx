import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Award, Star, Trophy, Footprints, CalendarCheck, Coffee, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

// Mapping string icons to Lucide components
const IconMap = {
    'Award': Award,
    'Star': Star,
    'Trophy': Trophy,
    'Footprints': Footprints,
    'CalendarCheck': CalendarCheck,
    'Coffee': Coffee
};

const AchievementShowcase = () => {
    const [achievements, setAchievements] = useState({ earned: [], locked: [], xp: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                const res = await api.get('/achievements/my-achievements');
                setAchievements({
                    earned: res.data.earned ?? [],
                    locked: res.data.locked ?? [],
                    xp: res.data.student?.xp ?? 0
                });
            } catch (error) {
                console.error("Failed to fetch achievements", error);
                setError("Failed to load achievements. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchAchievements();
    }, []);

    if (loading) {
        return (
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm mt-8 animate-pulse">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <div className="h-6 w-48 bg-slate-700 rounded mb-2"></div>
                        <div className="h-4 w-64 bg-slate-700/50 rounded"></div>
                    </div>
                    <div className="h-10 w-[200px] bg-slate-700/50 rounded-xl"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-slate-700/30 border border-slate-700/30 p-4 rounded-xl flex flex-col items-center h-32"></div>
                    ))}
                </div>
            </div>
        );
    }
    if (error) return <div className="text-red-400 text-center py-4">{error}</div>;

    // Next Level Calculation (simple logic: every 200 XP is a level)
    const currentLevel = Math.floor(achievements.xp / 200) + 1;
    const currentLevelXp = achievements.xp % 200;
    const progressPct = (currentLevelXp / 200) * 100;

    return (
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
                        <Award className="text-yellow-400" />
                        My Achievements
                    </h2>
                    <p className="text-sm text-slate-400">Unlock badges to show off your academic skills!</p>
                </div>

                {/* Level / XP Bar */}
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 min-w-[200px]">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold text-indigo-400">Level {currentLevel}</span>
                        <span className="text-slate-400">{achievements.xp} XP</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                        />
                    </div>
                    <div className="text-[10px] text-right text-slate-500 mt-1">{200 - currentLevelXp} XP to next level</div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Earned Achievements */}
                {achievements.earned.map((ach, idx) => {
                    const Icon = IconMap[ach.icon] || Award;
                    return (
                        <motion.div 
                            key={ach.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl flex flex-col items-center text-center relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 bg-indigo-500 text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg text-white">
                                +{ach.xp}
                            </div>
                            <div className="p-3 bg-indigo-500/20 rounded-full mb-3 text-indigo-400 group-hover:scale-110 transition-transform">
                                <Icon size={24} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-200 mb-1">{ach.name}</h3>
                            <p className="text-[10px] text-slate-400 leading-tight">{ach.description}</p>
                        </motion.div>
                    );
                })}

                {/* Locked Achievements */}
                {achievements.locked.map((ach) => {
                    return (
                        <div 
                            key={ach.id}
                            className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col items-center text-center opacity-60 grayscale"
                        >
                            <div className="p-3 bg-slate-800 rounded-full mb-3 text-slate-500">
                                <Lock size={24} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 mb-1">{ach.name}</h3>
                            <p className="text-[10px] text-slate-500 leading-tight">Secret Condition</p>
                        </div>
                    );
                })}
            </div>

            {achievements.earned.length === 0 && achievements.locked.length === 0 && (
                 <div className="text-center text-slate-500 py-4 text-sm">
                     Achievements are currently unavailable.
                 </div>
            )}
        </div>
    );
};

export default AchievementShowcase;
