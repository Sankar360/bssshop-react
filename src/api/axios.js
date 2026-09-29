// src/api/axios.js
import axios from 'axios';
import API_URL from './config';

const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
});

/* -------- Get token with priority order -------- */
function getStoredToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('customer_token') ||
    localStorage.getItem('admin_token') ||
    null
  );
}

/* -------- Request interceptor: attach token to every request -------- */
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/* -------- Response interceptor: handle 401 gracefully -------- */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;

    // If 401 and no admin session, this is a real logout
    if (status === 401) {
      const isAdmin = !!localStorage.getItem('admin_token');
      if (!isAdmin) {
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('customer_token');
      }
    }

    return Promise.reject(error);
  },
);

export default api;