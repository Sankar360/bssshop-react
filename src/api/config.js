// src/api/config.js
const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export default API_URL;