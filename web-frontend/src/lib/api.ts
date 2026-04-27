import axios from 'axios';

// Get API URL from localStorage or use default
const getApiUrl = () => {
  const stored = localStorage.getItem('apiUrl');
  if (stored) return stored;
  
  // Prefer environment variable if provided
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Default URLs based on environment
  const isDevelopment = import.meta.env.DEV;
  if (isDevelopment) {
    // For local development, try localhost first
    return 'https://172.31.32.154:8000/';
  }
  // Production: Use EC2 instance IP
  return 'https://3.6.92.87:8000/';
};

export const getApiBaseUrl = () => getApiUrl();

export const setApiBaseUrl = (url: string) => {
  // Normalize URL
  let normalized = url.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  if (!normalized.endsWith('/')) {
    normalized += '/';
  }
  localStorage.setItem('apiUrl', normalized);
  // Update axios instance
  api.defaults.baseURL = normalized;
};

const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('Network error - API endpoint may be unreachable:', getApiUrl());
    }
    return Promise.reject(error);
  }
);

// Login function for the dashboard
export const loginAsSecurityOfficer = async () => {
  try {
    const response = await api.post('/auth/login', {
      email: 'security@bioshield.io',
      password: 'security123'
    });
    
    if (response.data.access_token) {
      localStorage.setItem('authToken', response.data.access_token);
      // Update default header for all future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to authenticate:', error);
    return false;
  }
};

export default api;
