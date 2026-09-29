// src/api/axios.js
import axios from 'axios';
import API_URL, { API_ORIGIN } from './config';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

function getXsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const token = getXsrfToken();
    if (token) config.headers['X-XSRF-TOKEN'] = token;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('user');
      localStorage.removeItem('customer');
    }
    return Promise.reject(error);
  },
);

let csrfReady = false;
let csrfPromise = null;

export async function ensureCsrf(force = false) {
  if (csrfReady && !force) return;
  if (csrfPromise) return csrfPromise;

  csrfPromise = axios
    .get(`${API_ORIGIN}/sanctum/csrf-cookie`, { withCredentials: true })
    .then(() => {
      csrfReady = true;
    })
    .finally(() => {
      csrfPromise = null;
    });

  return csrfPromise;
}

export default api;