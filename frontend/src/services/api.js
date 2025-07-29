// src/services/api.js
import axios from 'axios';
import config from '../config';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || config.API_URL || 'http://localhost:5002/api';

// Create axios instance with timeout and retry functionality
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 second timeout
});

// Add token to requests if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Don't retry if we already tried or if it's a 401 (auth) error
    if (originalRequest._retry || 
        (error.response && error.response.status === 401)) {
      return Promise.reject(error);
    }
    
    // If the error is a network error or 5xx error, retry once
    if (!error.response || 
        (error.response && error.response.status >= 500 && error.response.status < 600)) {
      
      originalRequest._retry = true;
      
      console.warn('Request failed, retrying once...', originalRequest.url);
      
      try {
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return api(originalRequest);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API services
export const healthCheck = () => api.get('/health');

// Bot control functions
export const botControl = {
  getStatus: () => api.get('/api/bot/status'),
  start: (walletAddress, settings) => api.post('/api/bot/start', { walletAddress, settings }),
  stop: () => api.post('/api/bot/stop')
};

// Auth functions
export const auth = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/auth/profile')
};

// Wallet functions
export const wallet = {
  getBalance: (address) => api.get(`/api/wallet/balance/${address}`),
  getTokens: (address) => api.get(`/api/wallet/tokens/${address}`),
  connect: (address) => api.post('/api/wallet/connect', { walletAddress: address })
};

// Token functions
export const tokens = {
  getPopular: () => api.get('/api/tokens/popular'),
  getMemecoins: () => api.get('/api/tokens/memecoins'),
  search: (query) => api.get(`/api/tokens/search/${query}`),
  getDetails: (id) => api.get(`/api/tokens/${id}`),
  executeTrade: (data) => api.post('/api/tokens/trade', data)
};

// New token launches
export const launches = {
  getNewTokens: (chain = 'solana', limit = 10) => 
    api.get(`/api/new-launches?chain=${chain}&limit=${limit}`)
};

// Better export with a named constant
const apiService = {
  api,
  healthCheck,
  botControl,
  auth,
  wallet,
  tokens,
  launches
};

export default apiService;