// src/utils/auth.js
import apiFetch from "../api/apiFetch";

const TOKEN_KEYS = ['auth_token', 'customer_token', 'token', 'admin_token'];
const USER_KEYS = ['auth_user', 'admin_user', 'user', 'customer'];

export function getToken() {
    for (const k of TOKEN_KEYS) {
        const v = localStorage.getItem(k);
        if (v) return v;
    }
    return null;
}

export function getUser() {
    for (const k of USER_KEYS) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        try {
            return JSON.parse(raw);
        } catch {
            /* ignore */
        }
    }
    return null;
}

export function isLoggedIn() {
    return !!getToken();
}

export function clearAuth() {
    TOKEN_KEYS.forEach((k) => localStorage.removeItem(k));
    USER_KEYS.forEach((k) => localStorage.removeItem(k));
}

export async function logout() {
    const token = getToken();
    if (token) {
        try {
            await apiFetch('/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (err) {
            console.warn('Logout API failed; clearing local session anyway', err);
        }
    }
    clearAuth();
}