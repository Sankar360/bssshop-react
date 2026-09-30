// src/contexts/AuthContext.jsx
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from 'react';
import api from '../api/axios';
import {
    getUser as getStoredUser,
    setUser as setStoredUser,
    getToken,
    setToken,
    clearAuth,
} from '../utils/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    const refreshAuth = useCallback(async () => {
        const token = getToken();
        const storedUser = getStoredUser();

        if (!token) {
            setUser(null);
            setLoggedIn(false);
            setIsAdmin(false);
            setLoading(false);
            return;
        }

        if (storedUser) {
            setUser(storedUser);
            setLoggedIn(true);
            setIsAdmin(storedUser.role === 'admin');
        }

        try {
            const { data } = await api.get('/auth/check');
            if (data?.is_logged_in && data?.data?.user) {
                setUser(data.data.user);
                setLoggedIn(true);
                setIsAdmin(data.data.user.role === 'admin');
                setStoredUser(data.data.user);
            } else {
                clearAuth();
                setUser(null);
                setLoggedIn(false);
                setIsAdmin(false);
            }
        } catch {
            clearAuth();
            setUser(null);
            setLoggedIn(false);
            setIsAdmin(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshAuth();
    }, [refreshAuth]);

    /**
     * Save user + (optional) token.
     * Called from admin login and customer register/login.
     */
    const setAuthUser = useCallback((u, token = null) => {
        if (!u) {
            setUser(null);
            setLoggedIn(false);
            setIsAdmin(false);
            clearAuth();
            return;
        }
        if (token) setToken(token);
        setUser(u);
        setLoggedIn(true);
        setIsAdmin(u.role === 'admin');
        setStoredUser(u);
    }, []);

    const doLogin = async (email, password, remember = false) => {
        const { data } = await api.post('/auth/login', {
            email: String(email || '').trim(),
            password: String(password || ''),
            remember: !!remember,
        });

        if (data?.success && data?.data?.user) {
            setAuthUser(data.data.user, data.data.token);
        }
        return data;
    };

    const doRegister = async (payload) => {
        const { data } = await api.post('/auth/register', payload);
        if (data?.success && data?.data?.user) {
            setAuthUser(data.data.user, data.data.token);
        }
        return data;
    };

    const doLogout = async () => {
        try {
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