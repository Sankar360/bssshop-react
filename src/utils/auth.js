// src/utils/auth.js
import api, { ensureCsrf } from '../api/axios';

const USER_KEYS = ['auth_user', 'admin_user', 'user', 'customer'];

/* ---------------------------------------------------------------- */
/*  User (stored in localStorage for UI purposes only — NOT auth)   */
/* ---------------------------------------------------------------- */
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
}

/* ---------------------------------------------------------------- */
/*  Auth check — must ask the server (session is HttpOnly cookie)   */
/* ---------------------------------------------------------------- */
export async function isLoggedIn() {
    try {
        const { data } = await api.get('/auth/check');
        return !!data?.is_logged_in;
    } catch {
        return false;
    }
}

/* ---------------------------------------------------------------- */
/*  Login — establishes session cookie server-side                  */
/* ---------------------------------------------------------------- */
export async function login(email, password, remember = false) {
    await ensureCsrf(); // sets XSRF-TOKEN + laravel-session cookies
    const { data } = await api.post('/auth/login', { email, password, remember });

    if (data?.success && data?.data?.user) {
        setUser(data.data.user);
    }
    return data;
}

/* ---------------------------------------------------------------- */
/*  Register — same as login, session-based                         */
/* ---------------------------------------------------------------- */
export async function register(payload) {
    await ensureCsrf();
    const { data } = await api.post('/auth/register', payload);

    if (data?.success && data?.data?.user) {
        setUser(data.data.user);
    }
    return data;
}

/* ---------------------------------------------------------------- */
/*  Logout — invalidates session server-side, clears local user     */
/* ---------------------------------------------------------------- */
export async function logout() {
    try {
        await ensureCsrf();
        await api.post('/auth/logout');
    } catch (err) {
        console.warn('Logout API failed; clearing local user state anyway', err);
    }
    clearAuth();
}

/* ---------------------------------------------------------------- */
/*  Back-compat: getToken() and isLoggedInSync() return nothing     */
/*  Use getUser() for UI, isLoggedIn() for server truth.            */
/* ---------------------------------------------------------------- */
export function getToken() {
    return null;
}

export function isLoggedInSync() {
    return !!getUser();
}