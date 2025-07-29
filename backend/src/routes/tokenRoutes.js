// src/routes/tokenRoutes.js
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import authMiddleware from '../middlewares/auth.js';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Sample token data (would be fetched from APIs in production)
const popularTokens = [
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
    id: 'tether',
    symbol: 'usdt',
    name: 'Tether',
    current_price: 1.17,
    market_cap: 142167081118,
    image: 'https://assets.coingecko.com/coins/images/325/large/tether.png',
    price_change_percentage_24h: 16.67
  },
  {
    id: 'ripple',
    symbol: 'xrp',
    name: 'XRP',
    current_price: 2.24,
    market_cap: 129730924045,
    image: 'https://assets.coingecko.com/coins/images/44/large/xrp.png',
    price_change_percentage_24h: -0.45
  },
  {
    id: 'cardano',
    symbol: 'ada',
    name: 'Cardano',
    current_price: 0.95,
    market_cap: 34876543210,
    image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
    price_change_percentage_24h: 3.27
  }
];

const memeCoinList = [
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

/**
 * @route   GET /api/tokens/popular
 * @desc    Get popular tokens
 * @access  Public
 */
router.get('/popular', async (req, res) => {
  try {
    // In a real app, you'd fetch this from a cryptocurrency API like CoinGecko
    // const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1');
    // const tokens = response.data;

    res.json({
      status: 'success',
      data: popularTokens
    });
  } catch (error) {
    logger.error(`Get popular tokens error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching popular tokens'
    });
  }
});

/**
 * @route   GET /api/tokens/memecoins
 * @desc    Get trending meme coins
 * @access  Public
 */
router.get('/memecoins', async (req, res) => {
  try {
    // In a real app, you'd fetch this from a cryptocurrency API
    res.json({
      status: 'success',
      data: memeCoinList
    });
  } catch (error) {
    logger.error(`Get meme coins error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching meme coins'
    });
  }
});

/**
 * @route   GET /api/tokens/search/:query
 * @desc    Search for tokens
 * @access  Public
 */
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query must be at least 2 characters'
      });
    }
    
    // In a real app, you'd search from an API or database
    // Simple search implementation for demo
    const searchResults = [...popularTokens, ...memeCoinList].filter(token => {
      const searchTerm = query.toLowerCase();
      return (
        token.name.toLowerCase().includes(searchTerm) ||
        token.symbol.toLowerCase().includes(searchTerm) ||
        token.id.toLowerCase().includes(searchTerm)
      );
    });
    
    res.json({
      status: 'success',
      data: searchResults
    });
  } catch (error) {
    logger.error(`Search tokens error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error searching for tokens'
    });
  }
});

/**
 * @route   GET /api/tokens/:id
 * @desc    Get token details
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Search for token in our sample data
    const allTokens = [...popularTokens, ...memeCoinList];
    const token = allTokens.find(t => t.id === id);
    
    if (!token) {
      return res.status(404).json({
        status: 'error',
        message: 'Token not found'
      });
    }
    
    // Add additional details for demo
    const tokenDetails = {
      ...token,
      volume_24h: token.market_cap * 0.05,
      all_time_high: token.current_price * 1.5,
      all_time_low: token.current_price * 0.5,
      circulating_supply: token.market_cap / token.current_price,
      total_supply: (token.market_cap / token.current_price) * 1.2,
      description: `${token.name} (${token.symbol.toUpperCase()}) is a cryptocurrency.`,
      website: `https://${token.id}.org`,
      explorer: `https://blockchain-explorer.com/${token.id}`,
      social: {
        twitter: `https://twitter.com/${token.id}`,
        telegram: `https://t.me/${token.id}`,
        reddit: `https://reddit.com/r/${token.id}`
      }
    };
    
    res.json({
      status: 'success',
      data: tokenDetails
    });
  } catch (error) {
    logger.error(`Get token error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching token details'
    });
  }
});

/**
 * @route   POST /api/tokens/trade
 * @desc    Execute a trade
 * @access  Private
 */
router.post('/trade', authMiddleware, async (req, res) => {
  try {
    const { tokenId, amount, type, walletAddress } = req.body;
    
    // Validate inputs
    if (!tokenId || !amount || !type || !walletAddress) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required trade parameters'
      });
    }
    
    if (type !== 'buy' && type !== 'sell') {
      return res.status(400).json({
        status: 'error',
        message: 'Trade type must be either "buy" or "sell"'
      });
    }
    
    // Find token
    const allTokens = [...popularTokens, ...memeCoinList];
    const token = allTokens.find(t => t.id === tokenId);
    
    if (!token) {
      return res.status(404).json({
        status: 'error',
        message: 'Token not found'
      });
    }
    
    // In a real app, you'd execute the trade on the blockchain
    // For demo, we'll simulate a successful trade
    const tradeResult = {
      id: `trade-${Date.now()}`,
      tokenId,
      tokenName: token.name,
      tokenSymbol: token.symbol,
      type,
      amount: parseFloat(amount),
      price: token.current_price,
      value: parseFloat(amount) * token.current_price,
      walletAddress,
      status: 'completed',
      timestamp: new Date(),
      txHash: `0x${Math.random().toString(16).substr(2, 40)}`
    };
    
    res.status(201).json({
      status: 'success',
      message: `${type.toUpperCase()} order executed successfully`,
      data: tradeResult
    });
  } catch (error) {
    logger.error(`Execute trade error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error executing trade'
    });
  }
});

/**
 * @route   GET /api/tokens/price/:id
 * @desc    Get token price
 * @access  Public
 */
router.get('/price/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Search for token in our sample data
    const allTokens = [...popularTokens, ...memeCoinList];
    const token = allTokens.find(t => t.id === id);
    
    if (!token) {
      return res.status(404).json({
        status: 'error',
        message: 'Token not found'
      });
    }
    
    res.json({
      status: 'success',
      data: {
        id: token.id,
        symbol: token.symbol,
        name: token.name,
        price: token.current_price,
        price_change_percentage_24h: token.price_change_percentage_24h
      }
    });
  } catch (error) {
    logger.error(`Get token price error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching token price'
    });
  }
});

export default router;