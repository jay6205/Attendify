import React from 'react';
import { motion } from 'framer-motion';
import { Zap, User, Shield, ArrowRight } from 'lucide-react';

const DEMO_ACCOUNTS = [
    {
        role: 'Student',
        email: 'student@demo.com',
        password: 'demo123',
        icon: User,
        gradient: 'from-indigo-500 to-purple-500',
        bgGlow: 'shadow-indigo-500/10',
        borderColor: 'border-indigo-500/20',
        description: 'Explore attendance, marks, AI advisor & achievements',
        portal: 'student',
    },
    {
        role: 'Admin',
        email: 'admin@demo.com',
        password: 'demo123',
        icon: Shield,
        gradient: 'from-rose-500 to-orange-500',
        bgGlow: 'shadow-rose-500/10',
        borderColor: 'border-rose-500/20',
        description: 'Manage teachers, courses, semesters & enrollment',
        portal: 'admin',
    },
];

const DemoCredentials = ({ onSelectCredential, expectedRole }) => {
    // Filter to only show relevant demo accounts for the current portal
    const visibleAccounts = DEMO_ACCOUNTS.filter(
        (account) => account.portal === expectedRole
    );

    if (visibleAccounts.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-6"
        >
            {/* Section header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <Zap size={12} className="text-amber-400" />
                    <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Quick Demo Access</span>
                </div>
                <div className="flex-1 h-px bg-slate-700/50" />
            </div>

            {/* Demo account cards */}
            <div className="space-y-2.5">
                {visibleAccounts.map((account) => {
                    const Icon = account.icon;
                    return (
                        <button
                            key={account.role}
                            type="button"
                            onClick={() => onSelectCredential(account.email, account.password)}
                            className={`w-full group relative overflow-hidden rounded-xl border ${account.borderColor} bg-slate-800/30 hover:bg-slate-800/60 backdrop-blur-sm p-3.5 text-left transition-all duration-200 hover:shadow-lg ${account.bgGlow}`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Icon */}
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${account.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                    <Icon size={16} className="text-white" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-semibold text-slate-200">
                                            Demo {account.role}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono truncate">
                                            {account.email}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate">
                                        {account.description}
                                    </p>
                                </div>

                                {/* Arrow */}
                                <ArrowRight size={16} className="text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                            </div>
                        </button>
                    );
                })}
            </div>

            <p className="text-[10px] text-slate-600 text-center mt-2">
                Click to auto-fill credentials • No signup required
            </p>
        </motion.div>
    );
};

export default DemoCredentials;
