import React, { useState, useEffect, useContext } from 'react';
import { Plus, Search, Shield, Trash2, RefreshCw, Power } from 'lucide-react';
import AuthContext from '../../context/AuthContext';

const AdminManagementPage = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { user } = useContext(AuthContext); // Access token via context if needed, or assume axios is configured

    // Form State
    // Organization State
    const [organizations, setOrganizations] = useState([]);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', organization: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Base API URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v2';

    // Fetch Admins
    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/super-admin/admins`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setAdmins(data);
            } else {
                setError('Failed to fetch admins');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Organizations
    const fetchOrganizations = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/super-admin/organizations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) setOrganizations(data);
        } catch (err) {
            console.error('Error fetching organizations:', err);
        }
    };

    useEffect(() => {
        fetchAdmins();
        fetchOrganizations();
    }, []);

    // Create Admin
    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/super-admin/admins`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newAdmin)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Admin created successfully!');
                setShowCreateModal(false);
                setNewAdmin({ name: '', email: '', password: '', organization: '' });
                fetchAdmins();
            } else {
                setError(data.message || 'Failed to create admin');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    // Toggle Status
    const handleToggleStatus = async (id, currentStatus) => {
        if (!window.confirm(`Are you sure you want to ${currentStatus ? 'disable' : 'enable'} this admin?`)) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/super-admin/admins/${id}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchAdmins();
            } else {
                alert('Failed to update status');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Reset Password (Mock UI for now, logic exists)
    const handleResetPassword = async (id) => {
        const newPass = prompt("Enter new password for this admin:");
        if (!newPass) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/super-admin/admins/${id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password: newPass })
            });

            if (response.ok) {
                alert('Password reset successfully');
            } else {
                alert('Failed to reset password');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Management</h1>
                    <p className="text-slate-400 text-sm sm:text-base">Create and manage institution administrators</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 sm:py-2 rounded-lg transition-colors font-medium w-full sm:w-auto text-sm sm:text-base"
                >
                    <Plus size={18} className="sm:w-5 sm:h-5" />
                    Create Admin
                </button>
            </div>

            {/* Error/Success Messages */}
            {error && <div className="bg-rose-500/10 text-rose-400 p-3 sm:p-4 rounded-lg border border-rose-500/20 text-sm sm:text-base">{error}</div>}
            {success && <div className="bg-emerald-500/10 text-emerald-400 p-3 sm:p-4 rounded-lg border border-emerald-500/20 text-sm sm:text-base">{success}</div>}

            {/* Admin List */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden w-full relative">
                <div className="overflow-x-auto w-full pb-2">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 text-xs sm:text-base">
                                <th className="p-3 sm:p-4 font-medium">Name</th>
                                <th className="p-3 sm:p-4 font-medium">Email</th>
                                <th className="hidden sm:table-cell p-3 sm:p-4 font-medium">Organization</th>
                                <th className="p-3 sm:p-4 font-medium">Status</th>
                                <th className="hidden lg:table-cell p-3 sm:p-4 font-medium">Role</th>
                                <th className="p-3 sm:p-4 sm:pr-8 font-medium text-right sm:text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading admins...</td></tr>
                            ) : admins.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400">No admins found. Create one to get started.</td></tr>
                            ) : (
                                admins?.map((admin) => (
                                    <tr key={admin?._id} className="hover:bg-slate-750 transition-colors group">
                                        <td className="p-3 sm:p-4 text-white font-medium text-sm sm:text-base">
                                            {admin?.name}
                                            {/* Mobile view only details */}
                                            <div className="sm:hidden text-xs text-slate-400 mt-1 flex flex-col gap-1">
                                                <span>{admin?.organization?.name || 'Unassigned'}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 sm:p-4 text-slate-300 text-xs sm:text-sm">{admin?.email}</td>
                                        <td className="hidden sm:table-cell p-3 sm:p-4 text-slate-300 text-sm">
                                            {admin?.organization ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                                                    {admin?.organization?.name}
                                                    <span className="text-xs text-slate-500">({admin?.organization?.code || 'N/A'})</span>
                                                </span>
                                            ) : (
                                                <span className="text-rose-400 text-xs">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="p-3 sm:p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${admin.isActive
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                }`}>
                                                {admin.isActive ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="hidden lg:table-cell p-3 sm:p-4 text-slate-400 text-sm capitalize">{admin.role}</td>
                                        <td className="p-3 sm:p-4 sm:pr-8">
                                            <div className="flex justify-end sm:justify-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleResetPassword(admin._id)}
                                                    className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Reset Password"
                                                >
                                                    <RefreshCw size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(admin._id, admin.isActive)}
                                                    className={`p-2 rounded-lg transition-colors ${admin.isActive
                                                        ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                                        : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                                                        }`}
                                                    title={admin.isActive ? "Disable" : "Enable"}
                                                >
                                                    <Power size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Admin Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md shadow-2xl p-4 sm:p-6 my-8">
                        <h2 className="text-xl font-bold text-white mb-4 sm:mb-6 flex justify-between items-center">
                            Create New Admin
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white p-1">✕</button>
                        </h2>

                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Organization</label>
                                <select
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    value={newAdmin.organization}
                                    onChange={e => setNewAdmin({ ...newAdmin, organization: e.target.value })}
                                >
                                    <option value="">Select Organization</option>
                                    {organizations.map(org => (
                                        <option key={org._id} value={org._id}>
                                            {org.name} ({org.code || 'No Code'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    value={newAdmin.name}
                                    onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    value={newAdmin.email}
                                    onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Initial Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    value={newAdmin.password}
                                    onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    Create Admin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagementPage;
