// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const TOKEN_KEYS = ['token', 'auth_token', 'customer_token', 'admin_token'];
const USER_KEYS = ['admin_user', 'auth_user', 'user', 'customer'];

const readStoredToken = () => {
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
};

const readStoredUser = () => {
  for (const k of USER_KEYS) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      /* ignore */
    }
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser());
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(readStoredToken());

  /* Keep context in sync with localStorage if another tab updates it */
  useEffect(() => {
    const onStorage = (e) => {
      if (TOKEN_KEYS.includes(e.key) || USER_KEYS.includes(e.key)) {
        setToken(readStoredToken());
        setUser(readStoredUser());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const storedUser = readStoredUser();
    if (storedUser && token) {
      setUser(storedUser);
      setLoading(false);
      return;
    }
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkAuth = async () => {
    try {
      const res = await api.get('/auth/check');
      if (res.data.success) {
        setUser(res.data.data.user);
        localStorage.setItem('auth_user', JSON.stringify(res.data.data.user));
      } else {
        logout();
      }
    } catch {
      const storedUser = readStoredUser();
      if (!storedUser) logout();
      else setUser(storedUser);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('auth_token', newToken);   // alias for legacy code
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(newUser);
      return res.data;
    }
    throw new Error(res.data.message);
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(newUser);
      return res.data;
    }
    throw new Error(res.data.message);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    } finally {
      TOKEN_KEYS.forEach((k) => localStorage.removeItem(k));
      USER_KEYS.forEach((k) => localStorage.removeItem(k));
      delete api.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (data) =>
    setUser((prev) => ({ ...prev, ...data }));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        loggedIn: !!user && !!token,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        updateUser,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};