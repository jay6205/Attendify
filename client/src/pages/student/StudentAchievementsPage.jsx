import React from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../../components/PageTransition';
import AchievementShowcase from '../../components/achievements/AchievementShowcase';

const StudentAchievementsPage = () => {
    return (
        <PageTransition>
            <div className="space-y-8 pb-20">
                <header>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-1">
                        Gamification Hub
                    </h1>
                    <p className="text-slate-400">
                        View your earned achievements, track your XP, and discover new badges to unlock!
                    </p>
                </header>

                <AchievementShowcase />
            </div>
        </PageTransition>
    );
};

export default StudentAchievementsPage;
