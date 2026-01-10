import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = () => {
    const { token, loading } = useContext(AuthContext);

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-indigo-400">
            Loading...
        </div>
    );

    return token ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
