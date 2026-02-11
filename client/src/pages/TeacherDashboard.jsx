import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckSquare, FileText, BarChart, Plus } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';

// Feature Card Component
const FeatureCard = ({ title, description, icon: Icon, color, actionLabel }) => (
    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/80 transition-all group">
        <div className={`p-3 rounded-lg w-fit mb-4 ${color} bg-opacity-10`}>
            <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-4">{description}</p>
        <button className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group-hover:gap-2 transition-all">
            {actionLabel} <span>→</span>
        </button>
    </div>
);

const TeacherDashboard = () => {
    const { user } = useContext(AuthContext);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <PageTransition>
            <div className="space-y-8 pb-20">
                {/* Header */}
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                            Teacher Portal
                        </h1>
                         <p className="text-slate-400">
                            Welcome back, <span className="text-white font-medium">{user?.name}</span>
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm border border-indigo-500/20">
                            {user?.details?.department || 'Department'}
                        </span>
                    </div>
                </header>

                {/* Main Feature Grid */}
                <motion.div 
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    <motion.div variants={item}>
                        <FeatureCard 
                            title="My Courses" 
                            description="Manage your courses, view student lists, and track progress."
                            icon={BookOpen}
                            color="text-emerald-400"
                            actionLabel="View Courses"
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <FeatureCard 
                            title="Mark Attendance" 
                            description="Quickly mark daily attendance for your active classes."
                            icon={CheckSquare}
                            color="text-blue-400"
                            actionLabel="Start Marking"
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <FeatureCard 
                            title="Leave Requests" 
                            description="Review and approve pending student leave applications."
                            icon={FileText}
                            color="text-amber-400"
                            actionLabel="View Pending"
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <FeatureCard 
                            title="Weekly Summary" 
                            description="Analyze attendance trends and student performance."
                            icon={BarChart}
                            color="text-purple-400"
                            actionLabel="View Report"
                        />
                    </motion.div>
                </motion.div>

                {/* Recent Activity / Quick Stats Section Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 min-h-[300px] flex items-center justify-center text-slate-500">
                        <div className="text-center">
                            <BarChart size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Attendance Overview Graph (Coming Soon)</p>
                        </div>
                    </div>
                    
                    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 min-h-[300px] flex items-center justify-center text-slate-500">
                         <div className="text-center">
                            <FileText size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Recent Actions (Coming Soon)</p>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default TeacherDashboard;
