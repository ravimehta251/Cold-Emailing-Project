import axios from 'axios';

// Get API URL from environment variable (defined in frontend/.env)
// Maps to backend SERVER_PORT from backend/.env
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth endpoints
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
};

// SMTP Config endpoints
export const smtpAPI = {
  save: (data) => api.post('/smtp/save', data),
  get: () => api.get('/smtp'),
  delete: () => api.delete('/smtp'),
};

// Contact endpoints
export const contactAPI = {
  create: (data) => api.post('/contacts', data),
  getAll: () => api.get('/contacts'),
  get: (id) => api.get(`/contacts/${id}`),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/contacts/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Template endpoints
export const templateAPI = {
  create: (data) => api.post('/templates', data),
  getAll: () => api.get('/templates'),
  get: (id) => api.get(`/templates/${id}`),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
};

export const emailAPI = {
  sendBulk: (data) => api.post('/email/send-all', data),
  getLogs: () => api.get('/email/logs'),
  getStats: () => api.get('/email/stats'),
  getSessionProgress: (sessionId) => api.get(`/email/session/${sessionId}`),
};

// User endpoints
export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
  deleteMe: () => api.delete('/users/me'),
};

export default api;
