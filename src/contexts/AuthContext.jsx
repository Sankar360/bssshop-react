// src/contexts/AuthContext.jsx
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from 'react';
import api, { ensureCsrf } from '../api/axios';
import {
    setUser as setStoredUser,
    clearAuth,
} from '../utils/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    /**
     * Ask the backend who we are (uses session cookie).
     */
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
        ensureCsrf().finally(refreshAuth);
    }, [refreshAuth]);

    /**
     * Manually set the auth user (used after admin login where the
     * admin login endpoint is different from the customer login).
     */
    const setAuthUser = useCallback((u) => {
        if (!u) {
            setUser(null);
            setLoggedIn(false);
            setIsAdmin(false);
            clearAuth();
            return;
        }
        setUser(u);
        setLoggedIn(true);
        setIsAdmin(u.role === 'admin');
        setStoredUser(u);
    }, []);

    /**
     * Customer login via /auth/login
     */
    const doLogin = async (email, password, remember = false) => {
        await ensureCsrf();
        const { data } = await api.post('/auth/login', {
            email: String(email || '').trim(),
            password: String(password || ''),
            remember: !!remember,
        });

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
        await ensureCsrf(true).catch(() => {});
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
        setAuthUser,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
};