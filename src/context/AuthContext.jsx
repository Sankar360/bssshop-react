// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getToken, getUser as readStoredUser, clearAuth } from '../utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => readStoredUser());
    const [loggedIn, setLoggedIn] = useState(() => !!getToken());
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        const token = getToken();
        if (!token) {
            setUser(null);
            setLoggedIn(false);
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/check', {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error('Not authenticated');

            const data = await res.json();
            if (data.success && data.data?.user) {
                setUser(data.data.user);
                setLoggedIn(true);
                localStorage.setItem('auth_user', JSON.stringify(data.data.user));
            } else {
                clearAuth();
                setUser(null);
                setLoggedIn(false);
            }
        } catch {
            clearAuth();
            setUser(null);
            setLoggedIn(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const login = useCallback((user, token) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        setUser(user);
        setLoggedIn(true);
    }, []);

    const doLogout = useCallback(() => {
        clearAuth();
        setUser(null);
        setLoggedIn(false);
    }, []);

    const value = {
        user,
        loggedIn,
        isAdmin: user?.role === 'admin',
        loading,
        refresh,
        login,
        doLogout,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
};