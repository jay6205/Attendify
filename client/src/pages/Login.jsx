import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

const Login = ({ expectedRole = 'student', portalName = 'Student Portal' }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // Clear state when switching portals
    useEffect(() => {
        setError('');
        setEmail('');
        setPassword('');
    }, [expectedRole]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await login(email, password);

            // ROLE GUARD: Check if user belongs to this portal
            if (data.role !== expectedRole) {
                await logout(false); // Logout without redirecting
                setError('Invalid email or password');
                return;
            }

            // Redirect based on role
            if (data.role === 'admin') navigate('/admin');
            else if (data.role === 'teacher') navigate('/teacher');
            else navigate('/student');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    const getPortalColor = () => {
        if (expectedRole === 'admin') return 'from-rose-400 to-orange-400';
        if (expectedRole === 'teacher') return 'from-emerald-400 to-teal-400';
        return 'from-indigo-400 to-purple-400';
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 w-full max-w-md backdrop-blur-md shadow-xl">
                <div className="text-center mb-8">
                    <img
                        src="/Gemini_Generated_Image_71kxcc71kxcc71kx.png"
                        alt="Attendify Logo"
                        className="w-16 h-16 rounded-xl object-cover mx-auto mb-4 shadow-lg shadow-indigo-500/20"
                    />
                    <h1 className={`text-3xl font-bold bg-gradient-to-r ${getPortalColor()} bg-clip-text text-transparent inline-block mb-2`}>
                        {portalName}
                    </h1>
                    <p className="text-slate-400">Welcome back! Please sign in.</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg mb-4 text-sm text-center flex items-center justify-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="user@example.com"
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
                        <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                        Sign In
                    </button>
                </form>

                {/* Portal Switcher */}
                <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-2">
                    <p className="text-xs text-center text-slate-500 mb-3">Not your portal?</p>
                    <div className="flex justify-center gap-4 text-sm">
                        {expectedRole !== 'student' && (
                            <Link to="/login/student" className="text-indigo-400 hover:text-indigo-300">Student Login</Link>
                        )}
                        {expectedRole !== 'teacher' && (
                            <Link to="/login/teacher" className="text-emerald-400 hover:text-emerald-300">Teacher Login</Link>
                        )}
                        {expectedRole !== 'admin' && (
                            <Link to="/login/admin" className="text-rose-400 hover:text-rose-300">Admin Login</Link>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center text-sm text-slate-500">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
