// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { ensureCsrf } from '../api/axios';
import { getUser as getStoredUser, setUser as setStoredUser, clearAuth } from '../utils/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    /* ------------------------------------------------------------- */
    /* Ask the server who we are — source of truth is the session.    */
    /* localStorage is only a UI cache; if the server says no, clear. */
    /* ------------------------------------------------------------- */
    const refreshAuth = useCallback(async () => {
        try {
            const { data } = await api.get('/auth/check');
            if (data?.is_logged_in && data?.data?.user) {
                setUser(data.data.user);
                setLoggedIn(true);
                setIsAdmin(data.data.user.role === 'admin');
                setStoredUser(data.data.user);
            } else {
                setUser(null);
                setLoggedIn(false);
                setIsAdmin(false);
                clearAuth();
            }
        } catch {
            setUser(null);
            setLoggedIn(false);
            setIsAdmin(false);
            clearAuth();
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Kick off CSRF so any subsequent POST works
        ensureCsrf().finally(refreshAuth);
    }, [refreshAuth]);

    /* Called by login/register components after the API call succeeds */
    const doLogin = async (email, password, remember = false) => {
        await ensureCsrf();
        const { data } = await api.post('/auth/login', { email, password, remember });
        if (data?.success && data?.data?.user) {
            setUser(data.data.user);
            setLoggedIn(true);
            setIsAdmin(data.data.user.role === 'admin');
            setStoredUser(data.data.user);
        }
        return data;
    };

    const doRegister = async (payload) => {
        await ensureCsrf();
        const { data } = await api.post('/auth/register', payload);
        if (data?.success && data?.data?.user) {
            setUser(data.data.user);
            setLoggedIn(true);
            setIsAdmin(false);
            setStoredUser(data.data.user);
        }
        return data;
    };

    const doLogout = async () => {
        try {
            await ensureCsrf();
            await api.post('/auth/logout');
        } catch {
            /* ignore */
        }
        setUser(null);
        setLoggedIn(false);
        setIsAdmin(false);
        clearAuth();
    };

    const value = {
        user,
        loggedIn,
        isAdmin,
        loading,
        login: doLogin,
        register: doRegister,
        logout: doLogout,
        refreshAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
};