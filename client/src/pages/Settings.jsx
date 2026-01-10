import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Save, AlertTriangle, Shield, Check, Lock, RefreshCw } from 'lucide-react';

const Settings = () => {
    const [attendanceTarget, setAttendanceTarget] = useState(75);
    const [originalTarget, setOriginalTarget] = useState(75);
    const [loading, setLoading] = useState(false);
    
    // Password Form
    const [passData, setPassData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [passMsg, setPassMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            setAttendanceTarget(res.data.attendanceRequirement || 75);
            setOriginalTarget(res.data.attendanceRequirement || 75);
        } catch (error) {
            console.error("Failed to load settings", error);
        }
    };

    const handleTargetSave = async () => {
        setLoading(true);
        try {
            await api.put('/settings', { attendanceRequirement: attendanceTarget });
            setOriginalTarget(attendanceTarget);
            alert("Attendance target updated!");
        } catch (error) {
            console.error("Update failed", error);
            alert("Failed to update settings");
        } finally {
            setLoading(false);
        }
    };

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

    const handleSemesterReset = async () => {
        if (window.confirm("ARE YOU SURE?\n\nThis will DELETE ALL Subjects, Timetable entries, and Attendance logs.\n\nThis action is irreversible.")) {
            if (window.confirm("FINAL WARNING: Start a fresh semester?\n\nAll your data will be wiped.")) {
                try {
                    await api.post('/settings/reset');
                    alert("Semester Reset Successful! Redirecting to Dashboard...");
                    window.location.href = "/";
                } catch (error) {
                    console.error("Reset failed", error);
                    alert("Failed to reset data");
                }
            }
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>

            {/* Section 1: Preferences */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                    <RefreshCw className="text-emerald-400" size={24} />
                    <h2 className="text-xl font-bold text-slate-100">Preferences</h2>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-slate-300 font-medium">Target Attendance Requirement</label>
                            <span className={`text-xl font-bold ${attendanceTarget >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {attendanceTarget}%
                            </span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={attendanceTarget} 
                            onChange={(e) => setAttendanceTarget(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                         <p className="text-xs text-slate-500 mt-2">
                            This updates the "Safe/Risk" calculations on your Dashboard.
                        </p>
                    </div>

                    <button 
                        onClick={handleTargetSave}
                        disabled={loading || attendanceTarget === originalTarget}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Save size={18} />
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Section 2: Security */}
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

            {/* Section 3: Danger Zone */}
            <div className="border border-rose-500/30 bg-rose-500/5 p-6 rounded-xl">
                 <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="text-rose-500" size={24} />
                    <h2 className="text-xl font-bold text-rose-100">Danger Zone</h2>
                </div>
                
                <p className="text-slate-400 text-sm mb-4">
                    Starting a new semester? This will clear all your subjects, attendance history, and timetable entries. Your account and settings will remain.
                </p>

                <button 
                    onClick={handleSemesterReset}
                    className="w-full py-3 border border-rose-500 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg font-bold transition-all uppercase tracking-wide flex items-center justify-center gap-2"
                >
                    <RefreshCw size={18} />
                    Reset Semester Data
                </button>
            </div>
        </div>
    );
};

export default Settings;
