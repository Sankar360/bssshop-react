// src/utils/auth.js
import api, { ensureCsrf } from '../api/axios';

const USER_KEYS = ['auth_user', 'admin_user', 'user', 'customer'];

export function getUser() {
    for (const k of USER_KEYS) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        try { return JSON.parse(raw); } catch { /* ignore */ }
    }
    return null;
}

export function setUser(user) {
    if (!user) return;
    localStorage.setItem('auth_user', JSON.stringify(user));
}

export function clearAuth() {
    USER_KEYS.forEach((k) => localStorage.removeItem(k));
}

/* Server-side logout — invalidates session cookie */
export async function logout() {
    try {
        await ensureCsrf();
        await api.post('/auth/logout');
    } catch (err) {
        console.warn('Logout API failed', err);
    }
    clearAuth();
}

/* Back-compat stubs */
export function getToken() { return null; }
export function isLoggedIn() { return false; }   // must be async via AuthContext