// src/api/axios.js
import axios from 'axios';
import API_URL from './config';

const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('customer_token') ||
    localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;