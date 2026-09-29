// src/api/axios.js
import axios from 'axios';
import API_URL from './config';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ✅ IMPORTANT: send Laravel session cookie
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
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


/* -------- Response interceptor -------- */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;

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