import React, { useState } from 'react';
import api from '../api/axios';
import { Shield, Lock } from 'lucide-react';

const Settings = () => {
    // Password Form
    const [passData, setPassData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [passMsg, setPassMsg] = useState({ type: '', text: '' });

    const handlePassChange = (e) => {
        setPassData({ ...passData, [e.target.name]: e.target.value });
    };

    const submitPasswordChange = async (e) => {
        e.preventDefault();
        setPassMsg({ type: '', text: '' });

        if (passData.newPassword !== passData.confirmPassword) {
            setPassMsg({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        try {
            await api.put('/auth/password', { 
                oldPassword: passData.oldPassword, 
                newPassword: passData.newPassword 
            });
            setPassMsg({ type: 'success', text: 'Password changed successfully' });
            setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setPassMsg({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>

            {/* Section: Security */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                    <Shield className="text-indigo-400" size={24} />
                    <h2 className="text-xl font-bold text-slate-100">Security</h2>
                </div>

                <form onSubmit={submitPasswordChange} className="space-y-4">
                    {passMsg.text && (
                        <div className={`p-3 rounded-lg text-sm ${passMsg.type === 'error' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {passMsg.text}
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Current Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-slate-600" size={16} />
                            <input 
                                type="password" 
                                name="oldPassword"
                                value={passData.oldPassword}
                                onChange={handlePassChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">New Password</label>
                            <input 
                                type="password" 
                                name="newPassword"
                                value={passData.newPassword}
                                onChange={handlePassChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                placeholder="New Password"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Confirm New</label>
                            <input 
                                type="password" 
                                name="confirmPassword"
                                value={passData.confirmPassword}
                                onChange={handlePassChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                placeholder="Confirm"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Settings;
