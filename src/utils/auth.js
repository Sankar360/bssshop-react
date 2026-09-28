// src/utils/auth.js
import apiFetch from "../api/apiFetch";
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function isLoggedIn() {
    return !!getToken();
}

export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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
