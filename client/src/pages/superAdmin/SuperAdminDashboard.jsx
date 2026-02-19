import React from 'react';
import { Users, Shield, Activity, Server, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all cursor-pointer group">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
                <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg bg-opacity-10 ${color}`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
        </div>
    </div>
);

const SuperAdminDashboard = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
                    <p className="text-slate-400">System Overview and Master Controls</p>
                </div>
                <div className="bg-rose-500/10 text-rose-400 px-4 py-2 rounded-full text-sm font-medium border border-rose-500/20">
                    Environment Mode: Secured
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {/* Quick Links Card */}
                 <Link to="/super-admin/admins">
                    <StatCard 
                        icon={Shield} 
                        label="System Admins" 
                        value="Manage" 
                        color="bg-emerald-500 text-emerald-500" 
                    />
                </Link>
                 <Link to="/super-admin/organizations">
                    <StatCard 
                        icon={Building2} 
                        label="Organizations" 
                        value="Manage" 
                        color="bg-indigo-500 text-indigo-500" 
                    />
                </Link>
                <StatCard 
                    icon={Server} 
                    label="System Status" 
                    value="Healthy" 
                    color="bg-blue-500 text-blue-500" 
                />
                <StatCard 
                    icon={Users} 
                    label="Total Users" 
                    value="--" 
                    color="bg-purple-500 text-purple-500" 
                />
                <StatCard 
                    icon={Activity} 
                    label="Active Sessions" 
                    value="--" 
                    color="bg-orange-500 text-orange-500" 
                />
            </div>

            {/* Recent Activity or Warnings could go here */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h2 className="text-lg font-bold text-white mb-4">Critical Actions</h2>
                <div className="flex gap-4">
                    <Link 
                        to="/super-admin/admins"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                    >
                        Manage Administrators
                    </Link>
                    <Link 
                        to="/super-admin/organizations"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                    >
                        Manage Organizations
                    </Link>
                    {/* Placeholder buttons for future features */}
                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors font-medium cursor-not-allowed opacity-50">
                        System Logs
                    </button>
                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors font-medium cursor-not-allowed opacity-50">
                        Database Maintenance
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
