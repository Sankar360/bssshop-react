// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

/* ---- helpers to read either admin or customer session ---- */
const readStoredToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('auth_token') ||
  localStorage.getItem('customer_token') ||
  localStorage.getItem('admin_token') ||
  null;

const readStoredUser = () => {
  const raw =
    localStorage.getItem('admin_user') ||
    localStorage.getItem('auth_user') ||
    localStorage.getItem('user') ||
    localStorage.getItem('customer') ||
    null;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser());
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(readStoredToken());

  useEffect(() => {
    // If we already have a stored user (admin OR customer), trust it immediately
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
      const response = await api.get('/auth/check');
      if (response.data.success) {
        setUser(response.data.data.user);
      } else {
        logout();
      }
    } catch {
      // Don't wipe admin session on a failed /me call
      const storedUser = readStoredUser();
      if (!storedUser) logout();
      else setUser(storedUser);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success) {
      const { token: newToken, user: newUser } = response.data.data;
      localStorage.setItem('token', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(newUser);
      return response.data;
    }
    throw new Error(response.data.message);
  };

  const register = async (data) => {
    const response = await api.post('/auth/register', data);
    if (response.data.success) {
      const { token: newToken, user: newUser } = response.data.data;
      localStorage.setItem('token', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(newUser);
      return response.data;
    }
    throw new Error(response.data.message);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('customer_token');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
    }
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loggedIn: !!user,
        isAuthenticated: !!user,
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
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
};