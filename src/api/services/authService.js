import api from '../axios';

export const authService = {
  checkAuth: () => api.get('/auth/check'),
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
};