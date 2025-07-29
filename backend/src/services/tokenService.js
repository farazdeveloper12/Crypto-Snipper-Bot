// src/services/tokenService.js
import axios from 'axios';
import apiService from './api';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

// Get popular tokens
export const getPopularTokens = async () => {
  try {
    const response = await apiService.tokens.getPopular();
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching popular tokens:', error);
    
    // Return fallback data
    return [
      {
        id: 'solana',
        symbol: 'SOL',
        name: 'Solana',
        image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
        current_price: 20.00,
        price_change_percentage_24h: 5.25,
        market_cap: 12000000000,
        total_volume: 500000000,
      },
      {
        id: 'raydium',
        symbol: 'RAY',
        name: 'Raydium',
        image: 'https://assets.coingecko.com/coins/images/13928/large/PSigc4ie_400x400.jpg',
        current_price: 0.22,
        price_change_percentage_24h: 3.8,
        market_cap: 100000000,
        total_volume: 10000000,
      }
    ];
  }
};

// Get trending meme coins
export const getTrendingMemeCoins = async () => {
  try {
    const response = await apiService.tokens.getMemecoins();
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching trending meme coins:', error);
    
    // Return fallback data
    return [
      {
        id: 'dogecoin',
        symbol: 'DOGE',
        name: 'Dogecoin',
        image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
        current_price: 0.08,
        price_change_percentage_24h: 2.5,
        market_cap: 8000000000,
        total_volume: 200000000,
      },
      {
        id: 'shiba-inu',
        symbol: 'SHIB',
        name: 'Shiba Inu',
        image: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
        current_price: 0.000009,
        price_change_percentage_24h: 1.8,
        market_cap: 4000000000,
        total_volume: 100000000,
      }
    ];
  }
};

// Search for tokens
export const searchTokens = async (query) => {
  try {
    const response = await apiService.tokens.search(query);
    return response.data.data || [];
  } catch (error) {
    console.error('Error searching tokens:', error);
    return [];
  }
};

// Execute a trade
export const executeTrade = async (tokenId, amount, type, walletAddress) => {
  try {
    const response = await apiService.tokens.executeTrade({
      tokenId,
      amount,
      type,
      walletAddress
    });
    
    return response.data;
  } catch (error) {
    console.error('Error executing trade:', error);
    throw error;
  }
};

// Get newly launched tokens
export const getNewlyLaunchedTokens = async (chain = 'solana', limit = 10) => {
  try {
    // Try to call the API
    const response = await apiService.launches.getNewTokens(chain, limit);
    return response.data;
  } catch (error) {
    console.warn('Error fetching newly launched tokens, using fallback data:', error);
    
    // Return fallback data
    return {
      status: 'success',
      data: [
        {
          id: 'fallback-token-1',
          name: 'Demo Token 1',
          symbol: 'DEMO1',
          image: 'https://via.placeholder.com/32',
          current_price: 0.00015,
          price_change_percentage_since_launch: 25.5,
          launchTime: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          initialLiquidity: 15000,
          scamRisk: 'low'
        },
        {
          id: 'fallback-token-2',
          name: 'Demo Token 2',
          symbol: 'DEMO2',
          image: 'https://via.placeholder.com/32',
          current_price: 0.00003,
          price_change_percentage_since_launch: 105.2,
          launchTime: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          initialLiquidity: 8000,
          scamRisk: 'medium'
        }
      ]
    };
  }
};

// Subscribe to real-time price updates
export const subscribeToRealTimeUpdates = (callback) => {
  // In a real implementation, this would use WebSockets or SSE
  // For now, we'll simulate updates with a timer
  console.log('Setting up mock real-time updates');
  
  const interval = setInterval(() => {
    // Generate a random price update
    const update = {
      type: 'price_update',
      timestamp: new Date().toISOString(),
      updates: [
        {
          id: 'solana',
          price_change: (Math.random() * 2 - 1) * 0.5, // Random change between -0.5% and +0.5%
        },
        {
          id: 'raydium',
          price_change: (Math.random() * 2 - 1) * 0.8, // Random change between -0.8% and +0.8%
        }
      ]
    };
    
    callback(update);
  }, 10000); // Update every 10 seconds
  
  // Return an unsubscribe function
  return () => clearInterval(interval);
};

// Monitor for new token launches
export const monitorNewLaunches = (callback) => {
  console.log('Setting up mock token launch monitoring');
  
  // Create a mock monitoring system that generates a new token every minute
  const interval = setInterval(() => {
    const mockNewToken = {
      id: `mock-token-${Date.now()}`,
      name: `Mock Token ${Math.floor(Math.random() * 1000)}`,
      symbol: `MCK${Math.floor(Math.random() * 100)}`,
      image: 'https://via.placeholder.com/32',
      current_price: Math.random() * 0.001,
      price_change_percentage_since_launch: Math.random() * 200 - 50,
      launchTime: new Date().toISOString(),
      initialLiquidity: Math.random() * 50000,
      scamRisk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
    };
    
    callback(mockNewToken);
  }, 60000);
  
  // Return an unsubscribe function
  return () => clearInterval(interval);
};

// Export the service
const tokenService = {
  getPopularTokens,
  getTrendingMemeCoins,
  searchTokens,
  executeTrade,
  getNewlyLaunchedTokens,
  subscribeToRealTimeUpdates,
  monitorNewLaunches
};

export default tokenService;