// src/api/axios.js
import axios from 'axios';
import API_URL from './config';
import { getToken, clearAuth } from '../utils/auth';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

// Attach Bearer token from localStorage to every request
api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// On 401, clear auth so the user is bounced to login
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            clearAuth();
        }
        return Promise.reject(error);
    },
);

export default api;