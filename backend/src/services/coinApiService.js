// src/services/coinApiService.js
import axios from 'axios';
import Token from '../models/Token.js';

// Fetch token data from CoinGecko API
export const fetchTokenData = async (symbol) => {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${symbol.toLowerCase()}`
    );
    
    if (response.data && response.data.length > 0) {
      const tokenData = response.data[0];
      
      return {
        name: tokenData.name,
        symbol: tokenData.symbol.toUpperCase(),
        price: tokenData.current_price,
        marketCap: tokenData.market_cap,
        priceChange24h: tokenData.price_change_percentage_24h,
        totalVolume: tokenData.total_volume,
        image: tokenData.image
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching token data:', error);
    return null;
  }
};

// Get new token listings
export const fetchNewTokens = async () => {
  try {
    // In a real application, you'd use a specialized API for new token listings
    // For demo purposes, we'll return a few hardcoded tokens
    
    // Current timestamp - 24 hours to simulate newly listed tokens
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Create or update mock tokens
    const mockTokens = [
      {
        name: 'SolFlare',
        symbol: 'FLARE',
        address: 'FLARExyz123456789abcdef',
        network: 'solana',
        price: 0.015,
        marketCap: 250000,
        liquidity: 150000,
        launchDate: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        isVerified: false
      },
      {
        name: 'LunarLink',
        symbol: 'LUNR',
        address: 'LUNRxyz123456789abcdef',
        network: 'solana',
        price: 0.05,
        marketCap: 500000,
        liquidity: 300000,
        launchDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        isVerified: true
      },
      {
        name: 'SolMatrix',
        symbol: 'MTRX',
        address: 'MTRXxyz123456789abcdef',
        network: 'solana',
        price: 0.075,
        marketCap: 750000,
        liquidity: 450000,
        launchDate: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
        isVerified: true
      }
    ];
    
    // Upsert these tokens into the database
    for (const tokenData of mockTokens) {
      await Token.findOneAndUpdate(
        { address: tokenData.address },
        tokenData,
        { upsert: true, new: true }
      );
    }
    
    // Query for new tokens
    const newTokens = await Token.find({
      launchDate: { $gte: yesterday }
    }).sort({ launchDate: -1 });
    
    return newTokens;
  } catch (error) {
    console.error('Error fetching new tokens:', error);
    return [];
  }
};

// Search for a token by address or symbol
export const searchToken = async (query) => {
  try {
    // Search in our database first
    const localToken = await Token.findOne({
      $or: [
        { address: query },
        { symbol: new RegExp(query, 'i') },
        { name: new RegExp(query, 'i') }
      ]
    });
    
    if (localToken) {
      return localToken;
    }
    
    // If not found locally, try to fetch from CoinGecko
    const tokenData = await fetchTokenData(query);
    
    if (tokenData) {
      // Create a new token in our database
      const newToken = new Token({
        name: tokenData.name,
        symbol: tokenData.symbol,
        price: tokenData.price,
        marketCap: tokenData.marketCap,
        network: 'solana', // Assuming Solana for all tokens
        address: `generated_${Date.now()}`, // In a real app, you'd use the actual address
        isVerified: true
      });
      
      await newToken.save();
      return newToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error searching for token:', error);
    return null;
  }
};