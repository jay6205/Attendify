import React, { useState, useEffect } from 'react';
import { Plus, Building2 } from 'lucide-react';

const OrganizationManagementPage = () => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', code: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Base API URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v2';

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/super-admin/organizations`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setOrganizations(data);
            } else {
                setError(data.message || 'Failed to fetch organizations');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/super-admin/organizations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Organization created successfully');
                setShowCreateModal(false);
                setFormData({ name: '', code: '' });
                fetchOrganizations();
            } else {
                setError(data.message || 'Failed to create organization');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Organizations</h1>
                    <p className="text-slate-400">Manage all organizations in the system</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Add Organization
                </button>
            </div>

            {/* Organizations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizations?.map(org => (
                    <div key={org?._id} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-indigo-500/10 p-3 rounded-lg">
                                <Building2 className="text-indigo-400" size={24} />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                org.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                                {org.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{org?.name}</h3>
                        <p className="text-slate-400 text-sm mb-4">Code: {org?.code || 'N/A'}</p>
                        
                        <div className="border-t border-slate-700 pt-4 mt-4 flex justify-between text-sm text-slate-500">
                            <span>Created: {new Date(org?.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-6">Create New Organization</h2>
                        
                        {error && (
                            <div className="mb-4 p-3 bg-rose-500/10 text-rose-400 rounded-lg text-sm border border-rose-500/20">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Organization Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Organization Code (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 uppercase"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizationManagementPage;
