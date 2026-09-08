import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL , // you can deployed at render or aws ec2 both
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Prevent accidental double /api/api/ prefix if baseURL already includes /api
    if (config.url && config.baseURL?.endsWith('/api') && config.url.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api/, '');
    }
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized (401). Please re-login.');
    }
    return Promise.reject(error);
  }
);

export default api;
