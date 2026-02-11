import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, token, loading } = useContext(AuthContext);

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-indigo-400">
            Loading...
        </div>
    );

    if (!token) return <Navigate to="/login" />;

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" />; // Or redirect to home
    }

    return <Outlet />;
};

export default ProtectedRoute;
