// src/services/tokenService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

/**
 * Get list of popular tokens
 * @returns {Promise<Array>} List of popular tokens
 */
const getPopularTokens = async () => {
  try {
    // For testing, use local data if API fails
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tokens/popular`);
      return response.data.data;
    } catch (apiError) {
      console.warn('API call failed, using fallback data', apiError);
      
      // Fallback data with prices
      return [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 95127.13,
          market_cap: 1715228569080,
          image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
          price_change_percentage_24h: 8.65
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          current_price: 2097.14,
          market_cap: 284180995305,
          image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
          price_change_percentage_24h: -14.17
        },
        {
          id: 'dogecoin',
          symbol: 'doge',
          name: 'Dog (Bitcoin)',
          current_price: 0.187,
          market_cap: 25876543210,
          image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
          price_change_percentage_24h: 12.34
        },
        {
          id: 'harrypotter',
          symbol: 'eth',
          name: 'HarryPotterObamaSonic10Inu (ETH)',
          current_price: 0.00023,
          market_cap: 12345678,
          image: 'https://assets.coingecko.com/coins/images/33766/large/hpos10i.png',
          price_change_percentage_24h: 45.87
        },
        {
          id: 'bitcoin-gold',
          symbol: 'btg',
          name: 'Bitcoin Gold',
          current_price: 41.87,
          market_cap: 733975124,
          image: 'https://assets.coingecko.com/coins/images/844/large/bitcoin-gold-logo.png',
          price_change_percentage_24h: 3.52
        },
        {
          id: 'magic-internet-money',
          symbol: 'mim',
          name: 'MAGIC•INTERNET•MONEY (Bitcoin)',
          current_price: 0.99,
          market_cap: 12387456,
          image: 'https://assets.coingecko.com/coins/images/16786/large/mimlogopng.png',
          price_change_percentage_24h: 0.12
        },
        {
          id: 'bitcoin-wizards',
          symbol: 'wzrd',
          name: 'Bitcoin Wizards',
          current_price: 0.0012,
          market_cap: 1234567,
          image: 'https://assets.coingecko.com/coins/images/30668/large/IMG_20230713_165155_619.jpg',
          price_change_percentage_24h: 32.67
        },
        {
          id: 'pups',
          symbol: 'pups',
          name: 'Pups (Bitcoin)',
          current_price: 0.00045,
          market_cap: 2345678,
          image: 'https://assets.coingecko.com/coins/images/33836/large/photo_2023-10-24_14.01.55.jpeg',
          price_change_percentage_24h: 24.53
        }
      ];
    }
  } catch (error) {
    console.error('Error fetching popular tokens:', error);
    throw error;
  }
};

/**
 * Get list of trending meme coins
 * @returns {Promise<Array>} List of trending meme coins
 */
const getTrendingMemeCoins = async () => {
  try {
    // For testing, use local data if API fails
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tokens/memecoins`);
      return response.data.data;
    } catch (apiError) {
      console.warn('API call failed, using fallback data', apiError);
      
      // Fallback data for meme coins
      return [
        {
          id: 'dogecoin',
          symbol: 'doge',
          name: 'Dogecoin',
          current_price: 0.187,
          market_cap: 25876543210,
          image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
          price_change_percentage_24h: 12.34
        },
        {
          id: 'shiba-inu',
          symbol: 'shib',
          name: 'Shiba Inu',
          current_price: 0.000045,
          market_cap: 15876543210,
          image: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
          price_change_percentage_24h: 8.76
        },
        {
          id: 'pepe',
          symbol: 'pepe',
          name: 'Pepe',
          current_price: 0.0000123,
          market_cap: 5876543210,
          image: 'https://assets.coingecko.com/coins/images/29850/large/pepe.png',
          price_change_percentage_24h: 22.54
        },
        {
          id: 'bonk',
          symbol: 'bonk',
          name: 'Bonk',
          current_price: 0.0000034,
          market_cap: 1876543210,
          image: 'https://assets.coingecko.com/coins/images/28840/large/bonk.png',
          price_change_percentage_24h: 15.21
        }
      ];
    }
  } catch (error) {
    console.error('Error fetching trending meme coins:', error);
    throw error;
  }
};

/**
 * Search for tokens
 * @param {string} query - Search query
 * @returns {Promise<Array>} Search results
 */
const searchTokens = async (query) => {
  try {
    // For testing, use local data if API fails
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tokens/search/${query}`);
      return response.data.data;
    } catch (apiError) {
      console.warn('API call failed, using fallback data for search', apiError);
      
      // Use the fallback token data and filter based on query
      const allTokens = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 95127.13,
          market_cap: 1715228569080,
          image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
          price_change_percentage_24h: 8.65
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          current_price: 2097.14,
          market_cap: 284180995305,
          image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
          price_change_percentage_24h: -14.17
        },
        {
          id: 'dogecoin',
          symbol: 'doge',
          name: 'Dog (Bitcoin)',
          current_price: 0.187,
          market_cap: 25876543210,
          image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
          price_change_percentage_24h: 12.34
        },
        {
          id: 'harrypotter',
          symbol: 'eth',
          name: 'HarryPotterObamaSonic10Inu (ETH)',
          current_price: 0.00023,
          market_cap: 12345678,
          image: 'https://assets.coingecko.com/coins/images/33766/large/hpos10i.png',
          price_change_percentage_24h: 45.87
        },
        {
          id: 'bitcoin-gold',
          symbol: 'btg',
          name: 'Bitcoin Gold',
          current_price: 41.87,
          market_cap: 733975124,
          image: 'https://assets.coingecko.com/coins/images/844/large/bitcoin-gold-logo.png',
          price_change_percentage_24h: 3.52
        },
        {
          id: 'magic-internet-money',
          symbol: 'mim',
          name: 'MAGIC•INTERNET•MONEY (Bitcoin)',
          current_price: 0.99,
          market_cap: 12387456,
          image: 'https://assets.coingecko.com/coins/images/16786/large/mimlogopng.png',
          price_change_percentage_24h: 0.12
        },
        {
          id: 'bitcoin-wizards',
          symbol: 'wzrd',
          name: 'Bitcoin Wizards',
          current_price: 0.0012,
          market_cap: 1234567,
          image: 'https://assets.coingecko.com/coins/images/30668/large/IMG_20230713_165155_619.jpg',
          price_change_percentage_24h: 32.67
        },
        {
          id: 'pups',
          symbol: 'pups',
          name: 'Pups (Bitcoin)',
          current_price: 0.00045,
          market_cap: 2345678,
          image: 'https://assets.coingecko.com/coins/images/33836/large/photo_2023-10-24_14.01.55.jpeg',
          price_change_percentage_24h: 24.53
        },
        {
          id: 'shiba-inu',
          symbol: 'shib',
          name: 'Shiba Inu',
          current_price: 0.000045,
          market_cap: 15876543210,
          image: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
          price_change_percentage_24h: 8.76
        },
        {
          id: 'pepe',
          symbol: 'pepe',
          name: 'Pepe',
          current_price: 0.0000123,
          market_cap: 5876543210,
          image: 'https://assets.coingecko.com/coins/images/29850/large/pepe.png',
          price_change_percentage_24h: 22.54
        },
        {
          id: 'bonk',
          symbol: 'bonk',
          name: 'Bonk',
          current_price: 0.0000034,
          market_cap: 1876543210,
          image: 'https://assets.coingecko.com/coins/images/28840/large/bonk.png',
          price_change_percentage_24h: 15.21
        }
      ];
      
      // Case-insensitive search in name, symbol, or id
      const lowercaseQuery = query.toLowerCase();
      return allTokens.filter(token => 
        token.name.toLowerCase().includes(lowercaseQuery) || 
        token.symbol.toLowerCase().includes(lowercaseQuery) || 
        token.id.toLowerCase().includes(lowercaseQuery)
      );
    }
  } catch (error) {
    console.error('Error searching tokens:', error);
    throw error;
  }
};

/**
 * Get token details
 * @param {string} tokenId - Token ID
 * @returns {Promise<Object>} Token details
 */
const getTokenDetails = async (tokenId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/tokens/${tokenId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching token details:', error);
    throw error;
  }
};

/**
 * Execute a trade
 * @param {string} tokenId - Token ID
 * @param {number} amount - Amount to trade
 * @param {string} type - Trade type (buy/sell)
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<Object>} Trade result
 */
const executeTrade = async (tokenId, amount, type, walletAddress) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/tokens/trade`, {
      tokenId,
      amount,
      type,
      walletAddress
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error executing trade:', error);
    throw error;
  }
};

/**
 * Get token price
 * @param {string} tokenId - Token ID
 * @returns {Promise<Object>} Price info
 */
const getTokenPrice = async (tokenId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/tokens/price/${tokenId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching token price:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time price updates (mock implementation)
 * @param {Function} callback - Function to call with updates
 * @returns {Function} Unsubscribe function
 */
const subscribeToRealTimeUpdates = (callback) => {
  if (!callback || typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }
  
  // In a real app, this would use WebSockets or SSE
  // For now, we'll simulate with setInterval
  const interval = setInterval(() => {
    // Simulate random price changes
    const updates = [];
    
    // Generate 1-3 random updates
    const updateCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < updateCount; i++) {
      // Pick a random token ID
      const tokenIds = ['bitcoin', 'ethereum', 'tether', 'ripple', 'dogecoin', 'shiba-inu', 'pepe'];
      const randomIndex = Math.floor(Math.random() * tokenIds.length);
      const tokenId = tokenIds[randomIndex];
      
      // Generate a random price change between -5% and +5%
      const priceChange = (Math.random() * 10 - 5) / 100;
      
      updates.push({
        id: tokenId,
        price_change: priceChange * 100 // Convert to percentage
      });
    }
    
    callback({
      type: 'price_update',
      timestamp: new Date(),
      updates
    });
  }, 5000); // Update every 5 seconds
  
  // Return unsubscribe function
  return () => {
    clearInterval(interval);
  };
};

const tokenService = {
  getPopularTokens,
  getTrendingMemeCoins,
  searchTokens,
  getTokenDetails,
  executeTrade,
  getTokenPrice,
  subscribeToRealTimeUpdates
};

export default tokenService;