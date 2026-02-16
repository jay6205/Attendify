import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [needsPhoneNumber, setNeedsPhoneNumber] = useState(false);
    // Track which portal the user logged in from (persisted across refresh)
    const [loginAs, setLoginAs] = useState(localStorage.getItem('loginAs') || null);

    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                    // Check if parent portal user still needs phone (e.g. page refresh)
                    const savedLoginAs = localStorage.getItem('loginAs');
                    if (savedLoginAs === 'parent' && !res.data.phoneNumber) {
                        setNeedsPhoneNumber(true);
                    }
                } catch (error) {
                    console.error("Failed to load user", error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('loginAs');
                    setToken(null);
                    setUser(null);
                    setLoginAs(null);
                }
            }
            setLoading(false);
        };

        loadUser();
    }, [token]);

    const login = async (email, password, portal) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data);
        // Track which portal was used
        if (portal) {
            localStorage.setItem('loginAs', portal);
            setLoginAs(portal);
        }
        // Show phone popup for parent portal logins with missing phone
        if ((portal === 'parent' || res.data.needsPhoneNumber) && !res.data.phoneNumber) {
            setNeedsPhoneNumber(true);
        }
        return res.data;
    };

    const register = async (name, email, password) => {
        const res = await api.post('/auth/register', { name, email, password });
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data);
        return res.data;
    };

    const loginWithToken = (token) => {
        localStorage.setItem('token', token);
        setToken(token);
    };

    const clearPhoneRequired = () => {
        setNeedsPhoneNumber(false);
    };

    const logout = async (shouldRedirect = true) => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Logout API failed", error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('loginAs');
            setToken(null);
            setUser(null);
            setLoginAs(null);
            setNeedsPhoneNumber(false);
            if (shouldRedirect) {
                window.location.href = '/';
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, loginWithToken, needsPhoneNumber, clearPhoneRequired, loginAs }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
