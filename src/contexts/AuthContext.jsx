// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import { authService } from '../api/services/authService';

const AuthContext = createContext();

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

  console.log('[AuthContext] initial', {
    storedToken: readStoredToken(),
    storedUser: readStoredUser(),
    stateUser: user,
    stateToken: token,
  });
  
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
      const response = await authService.checkAuth();
      if (response.data.success) {
        setUser(response.data.data.user);
      } else {
        logout();
      }
    } catch (error) {
      // Don't wipe admin session on a failed /me call
      const storedUser = readStoredUser();
      if (!storedUser) logout();
      else setUser(storedUser);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    if (response.data.success) {
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      return response.data;
    }
    throw new Error(response.data.message);
  };

  const register = async (data) => {
    const response = await authService.register(data);
    if (response.data.success) {
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      return response.data;
    }
    throw new Error(response.data.message);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // ignore
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
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
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loggedIn: !!user,                      // ← add this; Header uses it
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      updateUser,
      checkAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);