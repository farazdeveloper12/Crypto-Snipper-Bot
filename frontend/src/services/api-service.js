// frontend/src/services/api-service.js
import axios from 'axios';
import { handleApiError, logError } from '../utils/error-handler';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Token might be expired, logout user
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication Methods
  async login(email, password) {
    try {
      const response = await this.api.post('/auth/login', { email, password });
      this.setAuthToken(response.data.token);
      return response.data.user;
    } catch (error) {
      logError(error, 'Login');
      throw handleApiError(error);
    }
  }

  async register(userData) {
    try {
      const response = await this.api.post('/auth/register', userData);
      this.setAuthToken(response.data.token);
      return response.data.user;
    } catch (error) {
      logError(error, 'Registration');
      throw handleApiError(error);
    }
  }

  logout() {
    localStorage.removeItem('authToken');
    // Redirect to login page or trigger logout in auth context
  }

  setAuthToken(token) {
    localStorage.setItem('authToken', token);
  }

  // User Profile Methods
  async getUserProfile() {
    try {
      const response = await this.api.get('/user/profile');
      return response.data;
    } catch (error) {
      logError(error, 'Get Profile');
      throw handleApiError(error);
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await this.api.put('/user/profile', profileData);
      return response.data;
    } catch (error) {
      logError(error, 'Update Profile');
      throw handleApiError(error);
    }
  }

  // Wallet Methods
  async getWallets() {
    try {
      const response = await this.api.get('/wallets');
      return response.data;
    } catch (error) {
      logError(error, 'Get Wallets');
      throw handleApiError(error);
    }
  }

  async addWallet(walletData) {
    try {
      const response = await this.api.post('/wallets', walletData);
      return response.data;
    } catch (error) {
      logError(error, 'Add Wallet');
      throw handleApiError(error);
    }
  }

  // Trading Methods
  async getTradeHistory(params = {}) {
    try {
      const response = await this.api.get('/trades', { params });
      return response.data;
    } catch (error) {
      logError(error, 'Get Trade History');
      throw handleApiError(error);
    }
  }

  async executeTrade(tradeData) {
    try {
      const response = await this.api.post('/trades', tradeData);
      return response.data;
    } catch (error) {
      logError(error, 'Execute Trade');
      throw handleApiError(error);
    }
  }

  // Token Methods
  async searchTokens(query) {
    try {
      const response = await this.api.get('/tokens/search', { 
        params: { query } 
      });
      return response.data;
    } catch (error) {
      logError(error, 'Search Tokens');
      throw handleApiError(error);
    }
  }

  // Security Methods
  async updateSecuritySettings(settings) {
    try {
      const response = await this.api.put('/security/settings', settings);
      return response.data;
    } catch (error) {
      logError(error, 'Update Security Settings');
      throw handleApiError(error);
    }
  }

  // Dashboard Methods
  async getDashboardData() {
    try {
      const response = await this.api.get('/dashboard');
      return response.data;
    } catch (error) {
      logError(error, 'Get Dashboard Data');
      throw handleApiError(error);
    }
  }
}

export default new ApiService();