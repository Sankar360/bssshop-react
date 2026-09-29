// src/api/services/authService.js
import api from '../axios';

export const authService = {
    checkAuth: () => api.get('/auth/check'),

    login: ({ email, password, remember = false }) =>
        api.post('/auth/login', {
            email: String(email || '').trim(),
            password: String(password || ''),
            remember: !!remember,
        }),

    register: (payload) =>
        api.post('/auth/register', payload),

    logout: () => api.post('/auth/logout'),
};