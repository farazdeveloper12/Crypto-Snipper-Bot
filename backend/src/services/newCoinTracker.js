// src/services/newCoinTracker.js
import axios from 'axios';
import { Connection } from '@solana/web3.js';

// API endpoints
const DEX_SCREENER_API = 'https://api.dexscreener.com/latest/dex';
const COIN_MARKET_CAP_API = 'https://pro-api.coinmarketcap.com/v1';
const SOLSCAN_API = 'https://public-api.solscan.io';

// Your API keys - store these in .env file
const CMC_API_KEY = process.env.REACT_APP_CMC_API_KEY || '';
const SOLSCAN_API_KEY = process.env.REACT_APP_SOLSCAN_API_KEY || '';

// Track discovered tokens to avoid duplicates
let discoveredTokens = new Set();
let newTokenCache = [];

/**
 * Initialize connection to Solana and mempool monitoring
 */
const initializeBlockchainConnections = () => {
  // Connect to Solana mainnet
  const solanaConnection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  return { solanaConnection };
};

/**
 * Scan Dex Screener for newly added tokens
 * @returns {Promise<Array>} List of new tokens
 */
const scanDexScreenerForNewTokens = async () => {
  try {
    // Get latest pairs sorted by creation time
    const response = await axios.get(`${DEX_SCREENER_API}/pairs/solana`);
    
    if (!response.data || !response.data.pairs) {
      throw new Error('Invalid response from DexScreener API');
    }
    
    // Sort by creation time (newest first)
    const sortedPairs = response.data.pairs.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // Filter for tokens created in the last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const newPairs = sortedPairs.filter(pair => {
      return new Date(pair.createdAt).getTime() > oneDayAgo;
    });
    
    // Filter out already discovered tokens
    const newTokens = newPairs.filter(pair => {
      const tokenKey = pair.baseToken.address;
      if (discoveredTokens.has(tokenKey)) {
        return false;
      }
      
      // Add to discovered set
      discoveredTokens.add(tokenKey);
      return true;
    });
    
    // Format token data
    return newTokens.map(pair => ({
      id: pair.baseToken.address,
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name,
      current_price: parseFloat(pair.priceUsd || 0),
      market_cap: pair.fdv || 0,
      image: `https://via.placeholder.com/32/2a5298/FFFFFF?text=${pair.baseToken.symbol.substring(0, 2)}`,
      price_change_percentage_since_launch: pair.priceChange.h24 || 0,
      volume24h: pair.volume.h24 || 0,
      liquidity: pair.liquidity.usd || 0,
      initialLiquidity: pair.liquidity.usd || 0, // Initial value at discovery
      launchTime: pair.createdAt,
      scamRisk: 'pending', // Will be assessed in separate function
      dex: pair.dexId,
      pairAddress: pair.pairAddress
    }));
  } catch (error) {
    console.error('Error scanning for new tokens:', error);
    return [];
  }
};

/**
 * Check token for potential scam indicators
 * @param {Object} token - Token data
 * @returns {Promise<Object>} Scam risk assessment
 */
const assessTokenRisk = async (token) => {
  try {
    // Basic risk indicators
    const riskIndicators = {
      lowLiquidity: token.liquidity < 10000, // Less than $10k liquidity
      highPriceVolatility: Math.abs(token.price_change_percentage_since_launch) > 50,
      suspiciousName: /safe|moon|elon|doge|shib|inu|pepe|wojak|cum|porn|meme/i.test(token.name),
      noWebsite: true, // Default to true until we can check
      anonymousDev: true, // Default to true until we can check
    };
    
    // Calculate risk score (0-100)
    let riskScore = 0;
    
    if (riskIndicators.lowLiquidity) riskScore += 30;
    if (riskIndicators.highPriceVolatility) riskScore += 15;
    if (riskIndicators.suspiciousName) riskScore += 10;
    if (riskIndicators.noWebsite) riskScore += 20;
    if (riskIndicators.anonymousDev) riskScore += 25;
    
    // Cap at 100
    riskScore = Math.min(riskScore, 100);
    
    // Determine risk level
    let riskLevel = 'low';
    if (riskScore > 70) riskLevel = 'high';
    else if (riskScore > 40) riskLevel = 'medium';
    
    return {
      ...token,
      scamRisk: riskLevel,
      riskScore,
      riskIndicators
    };
  } catch (error) {
    console.error('Error assessing token risk:', error);
    return {
      ...token,
      scamRisk: 'unknown',
      riskScore: 50
    };
  }
};

/**
 * Start real-time monitoring for new token launches
 * @param {Function} callback - Function to call with new tokens
 * @returns {Function} Function to stop monitoring
 */
const startNewTokenMonitoring = (callback) => {
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }
  
  console.log('Starting real-time token monitoring...');
  
  // Initialize connections
  initializeBlockchainConnections();
  
  // Scan frequently for new tokens
  const scanInterval = setInterval(async () => {
    try {
      // Scan for new tokens
      const newTokens = await scanDexScreenerForNewTokens();
      
      if (newTokens.length > 0) {
        console.log(`Found ${newTokens.length} new tokens`);
        
        // Process each token for risk assessment
        for (const token of newTokens) {
          const assessedToken = await assessTokenRisk(token);
          
          // Add to cache
          newTokenCache.push(assessedToken);
          
          // Notify callback
          callback(assessedToken);
        }
      }
    } catch (error) {
      console.error('Error in token monitoring interval:', error);
    }
  }, 30000); // Scan every 30 seconds
  
  // Return function to stop monitoring
  return () => {
    clearInterval(scanInterval);
    console.log('Stopped token monitoring');
  };
};

/**
 * Get recently discovered tokens
 * @param {number} limit - Maximum number of tokens to return
 * @returns {Array} Recently discovered tokens
 */
const getRecentlyDiscoveredTokens = (limit = 20) => {
  return newTokenCache.slice(0, limit);
};

export default {
  startNewTokenMonitoring,
  scanDexScreenerForNewTokens,
  assessTokenRisk,
  getRecentlyDiscoveredTokens
};