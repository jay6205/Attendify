import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await register(name, email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };
    
    // ... (rest of return)

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 w-full max-w-md backdrop-blur-md shadow-xl">
                 {/* ... header ... */}
                 <div className="text-center mb-8">
                    <img 
                        src="/Gemini_Generated_Image_71kxcc71kxcc71kx.png" 
                        alt="Attendify Logo" 
                        className="w-16 h-16 rounded-xl object-cover mx-auto mb-4 shadow-lg shadow-indigo-500/20"
                    />
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent inline-block mb-2">
                        Attendify
                    </h1>
                    <p className="text-slate-400">Create your account to get started.</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                        <input 
                            type="text" 
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                        <input 
                            type="email" 
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="student@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                        <input 
                            type="password" 
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 group"
                    >
                        <UserPlus size={20} className="group-hover:translate-x-1 transition-transform" />
                        Create Account
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
