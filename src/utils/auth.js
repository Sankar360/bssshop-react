// src/utils/auth.js
const USER_KEY = 'auth_user';
const TOKEN_KEY = 'auth_token';

export function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

export function setUser(user) {
    if (!user) return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export function clearAuth() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    // legacy keys — safe to purge
    localStorage.removeItem('admin_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('customer');
}