import React, { useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthSuccess = () => {
    const [searchParams] = useSearchParams();
    const { loginWithToken } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            loginWithToken(token);
            navigate('/');
        } else {
            navigate('/login');
        }
    }, [searchParams, loginWithToken, navigate]);

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-200">Authenticating...</h2>
            </div>
        </div>
    );
};

export default AuthSuccess;
