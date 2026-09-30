// src/utils/auth.js
const USER_KEYS = ['auth_user', 'admin_user', 'user', 'customer'];

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

export function setUser(user) {
    if (!user) return;
    localStorage.setItem('auth_user', JSON.stringify(user));
}

export function clearAuth() {
    USER_KEYS.forEach((k) => localStorage.removeItem(k));
    // Legacy cleanup — make sure no token keys linger
    localStorage.removeItem('admin_token');
    localStorage.removeItem('token');
}

/* ---- Back-compat stubs (no longer used for auth) ---- */
export function getToken() {
    return null;
}

export function setToken() {
    /* no-op */
}

export function removeToken() {
    /* no-op */
}