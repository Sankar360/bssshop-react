// src/api/config.js
const ROOT =
  (import.meta.env.VITE_API_ROOT || 'http://localhost:8000').replace(/\/+$/, '');

const API_URL =
  import.meta.env.VITE_API_URL || `${ROOT}/api`;

export const API_ORIGIN = ROOT;   // for /sanctum/csrf-cookie, image URLs, etc.
export default API_URL;