import React, { useEffect, useState, useContext } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import SubjectCard from '../components/SubjectCard';
import Modal from '../components/Modal';
import AddSubjectForm from '../components/AddSubjectForm';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import SkeletonCard from '../components/SkeletonCard';

// Stat Card Component
const StatCard = ({ label, value, subtext, icon, color }) => (
    <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
        <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-sm font-medium">{label}</span>
            {icon && <span className={`${color} opacity-80`}>{icon}</span>}
        </div>
        <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{value}</span>
            {subtext && <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${color} bg-opacity-10 mb-1`}>{subtext}</span>}
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/subjects');
            if (Array.isArray(res.data)) {
                setSubjects(res.data);
            } else {
                console.error("API Error: Expected array, got", typeof res.data, res.data);
                setSubjects([]);
            }
        } catch (error) {
            console.error("Error fetching subjects:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const handleDeleteSubject = async (id) => {
        try {
            await api.delete(`/subjects/${id}`);
            // Optimistic update
            setSubjects(prev => prev.filter(sub => sub._id !== id));
        } catch (error) {
            console.error("Failed to delete subject", error);
            alert("Failed to delete subject");
        }
    };

    // Helper to calculate summary stats
    const calculateStats = () => {
        if (!subjects.length) return { avg: 0, totalClasses: 0, bunkable: 0, critical: 0 };
        
        let totalPct = 0;
        let totalClasses = 0;
        let bunkable = 0;
        let critical = 0;

        subjects.forEach(sub => {
            const pct = sub.total === 0 ? 0 : (sub.attended / sub.total) * 100;
            totalPct += pct;
            totalClasses += sub.total;
            
            const target = user?.attendanceRequirement || 75;
            if (pct >= target) {
                 // Check if safe bunks > 0
                 const possibleTotal = sub.attended / (target / 100);
                 const safe = Math.floor(possibleTotal - sub.total);
                 if (safe > 0) bunkable += safe;
            } else {
                critical++;
            }
        });

        return {
            avg: Math.round(totalPct / subjects.length),
            totalClasses,
            bunkable,
            critical
        };
    };

    const stats = calculateStats();

    // Staggered Animation Variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
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
                         <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-1">
                            Good Morning, {user?.email?.split('@')[0] || 'Student'}
                        </h1>
                         <p className="text-slate-400">
                            You can safely bunk <span className="text-emerald-400 font-bold">{stats.bunkable} classes</span> today.
                        </p>
                    </div>
                    <div className="text-right hidden md:block">
                         <span className="text-slate-400 text-sm">Current Aggregate</span>
                         <div className="text-3xl font-bold text-white">{stats.avg}%</div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard 
                        label="Avg Attendance" 
                        value={`${stats.avg}%`} 
                        subtext={stats.avg >= 75 ? "+Good" : "Low"}
                        color={stats.avg >= 75 ? "text-emerald-400 bg-emerald-400" : "text-rose-400 bg-rose-400"}
                    />
                    <StatCard 
                        label="Total Classes" 
                        value={stats.totalClasses} 
                        color="text-indigo-400"
                    />
                    <StatCard 
                        label="Total Bunkable" 
                        value={stats.bunkable} 
                        icon="☂️"
                        color="text-emerald-400"
                    />
                    <StatCard 
                        label="Critical Subjects" 
                        value={stats.critical} 
                        icon="⚠️"
                        color="text-rose-400"
                    />
                </div>

                {/* Subjects Grid */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-100">Your Subjects</h2>
                        <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                            View All
                        </button>
                    </div>
                    
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : (
                        <motion.div 
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                        >
                            {subjects.map((subject) => (
                                <motion.div key={subject._id} variants={item}>
                                    <SubjectCard 
                                        {...subject}
                                        onUpdate={fetchSubjects} 
                                        onDelete={handleDeleteSubject}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </section>

                {/* Floating Action Button for Mobile / Fixed Button for Desktop */}
                 <button 
                    onClick={() => setIsModalOpen(true)}
                    className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg shadow-indigo-600/30 transition-transform hover:scale-110 flex items-center justify-center group z-40"
                >
                    <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                </button>

                {/* Modal */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Subject">
                    <AddSubjectForm 
                        onSubjectAdded={fetchSubjects} 
                        onClose={() => setIsModalOpen(false)} 
                    />
                </Modal>
            </div>
        </PageTransition>
    );
};

export default Dashboard;
