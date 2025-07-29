// backend/src/services/botService.js
import axios from 'axios';
import apiService from './apiService.js';
import logger from '../utils/logger.js';
import { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount, createTransferInstruction } from '@solana/spl-token';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

// Load environment variables
const PHANTOM_PRIVATE_KEY = process.env.PHANTOM_PRIVATE_KEY;
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
const JUPITER_API_URL = process.env.JUPITER_API_URL || 'https://quote-api.jup.ag/v6';

// Validate environment variables
if (!PHANTOM_PRIVATE_KEY) {
  throw new Error('PHANTOM_PRIVATE_KEY is not set in .env file');
}
if (!BIRDEYE_API_KEY) {
  throw new Error('BIRDEYE_API_KEY is not set in .env file');
}

const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
const walletKeypair = Keypair.fromSecretKey(Buffer.from(PHANTOM_PRIVATE_KEY, 'base64'));

const BIRDEYE_API_URL = 'https://public-api.birdeye.so';

/**
 * Start the trading bot
 * @param {Object} settings - Trading settings
 * @returns {Promise<Object>} Bot status
 */
const startBot = async (settings = {}) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/bot/start`, { settings });
    // Start QuickNode API subscription
    await apiService.startTokenSubscription();
    // Start token analysis
    startTokenAnalysis();
    return response.data;
  } catch (error) {
    console.error('Error starting bot:', error);
    throw error;
  }
};

/**
 * Stop the trading bot
 * @returns {Promise<Object>} Bot status
 */
const stopBot = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/bot/stop`);
    // Stop QuickNode API subscription
    await apiService.stopTokenSubscription();
    isBotRunning = false;
    return response.data;
  } catch (error) {
    console.error('Error stopping bot:', error);
    throw error;
  }
};

/**
 * Get the bot status
 * @returns {Promise<Object>} Bot status
 */
const getBotStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/bot/status`);
    return response.data.data;
  } catch (error) {
    console.error('Error getting bot status:', error);
    throw error;
  }
};

/**
 * Update the bot settings
 * @param {Object} settings - New settings
 * @returns {Promise<Object>} Updated settings
 */
const updateBotSettings = async (settings) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/bot/settings`, settings);
    return response.data.data.settings;
  } catch (error) {
    console.error('Error updating bot settings:', error);
    throw error;
  }
};

/**
 * Get the bot performance
 * @returns {Promise<Object>} Performance data
 */
const getBotPerformance = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/bot/performance`);
    return response.data.data;
  } catch (error) {
    console.error('Error getting bot performance:', error);
    throw error;
  }
};

/**
 * Add a custom token to the bot's watchlist
 * @param {string} tokenAddress - Token address to add
 * @returns {Promise<Object>} Updated watchlist
 */
const addTokenToWatchlist = async (tokenAddress) => {
  try {
    // In a real implementation, this would call your backend
    // For now, we'll simulate a successful response
    return {
      success: true,
      message: 'Token added to watchlist',
      watchlist: [tokenAddress]
    };
  } catch (error) {
    console.error('Error adding token to watchlist:', error);
    throw error;
  }
};

/**
 * Set up real-time trading alerts (mock implementation)
 * @param {Function} callback - Function to call when an alert is triggered
 * @returns {Function} Function to cancel alerts
 */
const setupTradingAlerts = (callback) => {
  if (!callback || typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }

  // In a real app, this would set up WebSocket connections
  // For now, we'll simulate with setInterval
  const interval = setInterval(() => {
    // 10% chance of triggering an alert every 30 seconds
    if (Math.random() < 0.1) {
      const alertTypes = ['new_token', 'price_spike', 'volume_spike', 'trade_executed'];
      const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];

      const tokens = ['bitcoin', 'ethereum', 'solana', 'dogecoin', 'pepe'];
      const randomToken = tokens[Math.floor(Math.random() * tokens.length)];

      callback({
        type: randomType,
        timestamp: new Date(),
        token: {
          id: randomToken,
          name: randomToken.charAt(0).toUpperCase() + randomToken.slice(1),
          symbol: randomToken.substring(0, 3).toUpperCase()
        },
        details: {
          percentage: Math.floor(Math.random() * 30) + 5,
          price: Math.random() * 1000
        }
      });
    }
  }, 30000); // Check every 30 seconds

  // Return function to cancel alerts
  return () => {
    clearInterval(interval);
  };
};

// src/services/botService.js
const getNewTokenLaunches = async () => {
  try {
    // Fetch tokens from QuickNode API via apiService
    const tokens = await apiService.fetchNewlyLaunchedTokens();
    return tokens;
  } catch (error) {
    console.error('Error fetching new token launches:', error);
    return [];
  }
};

// Backend bot logic for token analysis and trading
let isBotRunning = false;
const activeTrades = new Map(); // To store active trades for market cap monitoring

const startTokenAnalysis = () => {
  logger.info('Starting token analysis...');
  isBotRunning = true;

  // Fetch newly launched tokens periodically
  setInterval(async () => {
    if (!isBotRunning) return;

    const tokens = await apiService.fetchNewlyLaunchedTokens();
    await analyzeTokens(tokens);
    await apiService.clearNewlyLaunchedTokens(); // Clear the list after analysis
  }, 60000); // Check every 60 seconds

  // Start market cap monitoring for active trades
  setInterval(async () => {
    if (!isBotRunning) return;
    await monitorMarketCap();
  }, 30000); // Check every 30 seconds
};

const analyzeTokens = async (tokens) => {
  logger.info(`Newly launched tokens fetched: ${tokens.length}`);

  for (const token of tokens) {
    try {
      // Filter tokens launched within the last 24 hours
      const createdAt = new Date(token.createdAt).getTime();
      const currentTime = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if ((currentTime - createdAt) > oneDayInMs) {
        logger.info(`Token ${token.symbol} is older than 24 hours, skipping...`);
        continue;
      }

      // Analyze the token
      const analysisResult = await analyzeToken(token);

      if (analysisResult.shouldTrade) {
        logger.info(`Executing trade for token: ${token.name} (${token.symbol})`);
        logger.info(`Address: ${token.address}`);
        logger.info(`Created At: ${token.createdAt}`);
        logger.info(`Solscan Link: ${token.solscanLink}`);
        logger.info(`Market Cap: $${analysisResult.marketCap}`);
        logger.info(`Liquidity: $${analysisResult.liquidity}`);
        logger.info(`Volume (24h): $${analysisResult.volume24h}`);
        logger.info(`Top Holder Percentage: ${analysisResult.topHolderPercentage}%`);
        logger.info(`Scam Score: ${analysisResult.scamScore}/100`);

        // Execute trade
        await executeTrade(token, analysisResult);
      } else {
        logger.info(`Token ${token.symbol} rejected for trading. Reasons: ${analysisResult.reasons.join(', ')}`);
      }
    } catch (error) {
      logger.error(`Error analyzing token ${token.address}: ${error.message}`);
    }
  }
};

const analyzeToken = async (token) => {
  try {
    // Fetch token data from Birdeye API
    const response = await axios.get(`${BIRDEYE_API_URL}/defi/token_overview?address=${token.address}`, {
      headers: {
        'X-API-KEY': BIRDEYE_API_KEY,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    if (response.status !== 200 || !response.data.data) {
      logger.warn(`Birdeye API failed for token ${token.address}: ${response.statusText}`);
      return {
        shouldTrade: false,
        reasons: ['Failed to fetch token data from Birdeye API']
      };
    }

    const tokenData = response.data.data;

    // Extract required metrics
    const marketCap = tokenData.market_cap || 0;
    const liquidity = tokenData.liquidity || 0;
    const volume24h = tokenData.volume?.h24 || 0;
    const holders = tokenData.top_holders || [];
    const scamScore = tokenData.security?.score || 0; // Birdeye provides a security score

    // Analyze holders to detect whale activity
    let topHolderPercentage = 0;
    if (holders.length > 0) {
      const topHolder = holders[0];
      topHolderPercentage = topHolder.percent || 0;
    }

    // Analysis criteria
    const reasons = [];
    let shouldTrade = true;

    // Market Cap Check (should be reasonable, e.g., between $10,000 and $1,000,000 for new tokens)
    if (marketCap < 10000 || marketCap > 1000000) {
      reasons.push(`Market cap ($${marketCap}) is out of acceptable range ($10,000 - $1,000,000)`);
      shouldTrade = false;
    }

    // Liquidity Check (should be at least $5,000 for withdrawal feasibility)
    if (liquidity < 5000) {
      reasons.push(`Liquidity ($${liquidity}) is too low (minimum $5,000)`);
      shouldTrade = false;
    }

    // Volume Check (should be at least $1,000 in 24 hours)
    if (volume24h < 1000) {
      reasons.push(`24h volume ($${volume24h}) is too low (minimum $1,000)`);
      shouldTrade = false;
    }

    // Whale Activity Check (top holder should not own more than 50% of supply)
    if (topHolderPercentage > 50) {
      reasons.push(`Top holder owns ${topHolderPercentage}% of supply (too high, potential whale)`);
      shouldTrade = false;
    }

    // Scam Detection (scam score should be below 30)
    if (scamScore > 30) {
      reasons.push(`Scam score (${scamScore}/100) is too high (maximum 30)`);
      shouldTrade = false;
    }

    return {
      shouldTrade,
      reasons: reasons.length > 0 ? reasons : ['Token meets all criteria'],
      marketCap,
      liquidity,
      volume24h,
      topHolderPercentage,
      scamScore
    };
  } catch (error) {
    logger.error(`Error analyzing token ${token.address} with Birdeye API: ${error.message}`);
    return {
      shouldTrade: false,
      reasons: ['Failed to fetch token data from Birdeye API'],
      marketCap: 0,
      liquidity: 0,
      volume24h: 0,
      topHolderPercentage: 0,
      scamScore: 0
    };
  }
};

const executeTrade = async (token, analysisResult) => {
  try {
    // Placeholder trade execution logic using Phantom wallet
    const tokenMintAddress = new PublicKey(token.address);
    const walletPublicKey = walletKeypair.publicKey;

    // Get or create associated token account for the wallet
    const associatedTokenAddress = await getAssociatedTokenAddress(
      tokenMintAddress,
      walletPublicKey
    );

    let associatedTokenAccount;
    try {
      associatedTokenAccount = await getAccount(connection, associatedTokenAddress);
    } catch (error) {
      // If the associated token account doesn't exist, create it
      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          walletPublicKey, // Payer
          associatedTokenAddress, // Associated token account
          walletPublicKey, // Owner
          tokenMintAddress // Mint
        )
      );
      await sendAndConfirmTransaction(connection, transaction, [walletKeypair]);
      associatedTokenAccount = await getAccount(connection, associatedTokenAddress);
    }

    // Buy the token using Jupiter API
    const amountToBuy = 0.01; // 0.01 SOL (adjust as needed)
    const slippage = 0.02; // 2% slippage
    const quoteResponse = await axios.get(`${JUPITER_API_URL}/quote`, {
      params: {
        inputMint: 'So11111111111111111111111111111111111111112', // SOL
        outputMint: token.address,
        amount: Math.floor(amountToBuy * 1e9), // Convert SOL to lamports
        slippageBps: Math.floor(slippage * 10000) // Convert slippage to basis points
      }
    });

    if (quoteResponse.status !== 200 || !quoteResponse.data) {
      throw new Error('Failed to get quote from Jupiter API');
    }

    const swapResponse = await axios.post(`${JUPITER_API_URL}/swap`, {
      quoteResponse: quoteResponse.data,
      userPublicKey: walletPublicKey.toBase58(),
      wrapAndUnwrapSol: true
    });

    if (swapResponse.status !== 200 || !swapResponse.data) {
      throw new Error('Failed to execute swap with Jupiter API');
    }

    const swapTransaction = swapResponse.data.swapTransaction;
    const transaction = Transaction.from(Buffer.from(swapTransaction, 'base64'));
    const signature = await sendAndConfirmTransaction(connection, transaction, [walletKeypair]);

    logger.info(`Buy trade executed successfully for token ${token.symbol}. Transaction signature: ${signature}`);

    // Store the trade in activeTrades for market cap monitoring
    activeTrades.set(token.address, {
      token,
      entryMarketCap: analysisResult.marketCap,
      amount: amountToBuy,
      signature
    });

    return signature;
  } catch (error) {
    logger.error(`Error executing trade for token ${token.symbol}: ${error.message}`);
    throw error;
  }
};

const monitorMarketCap = async () => {
  try {
    logger.info('Monitoring market cap for active trades...');
    for (const [tokenAddress, trade] of activeTrades.entries()) {
      // Fetch current market cap from Birdeye API
      const response = await axios.get(`${BIRDEYE_API_URL}/defi/token_overview?address=${tokenAddress}`, {
        headers: {
          'X-API-KEY': BIRDEYE_API_KEY,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      if (response.status !== 200 || !response.data.data) {
        logger.warn(`Birdeye API failed for token ${tokenAddress} during market cap monitoring: ${response.statusText}`);
        continue;
      }

      const tokenData = response.data.data;
      const currentMarketCap = tokenData.market_cap || 0;

      // Check if market cap has increased significantly (e.g., 5x)
      const marketCapIncrease = currentMarketCap / trade.entryMarketCap;
      if (marketCapIncrease >= 5) {
        logger.info(`Market cap for token ${trade.token.symbol} increased by ${marketCapIncrease}x (from $${trade.entryMarketCap} to $${currentMarketCap}). Selling...`);

        // Sell the token using Jupiter API
        const quoteResponse = await axios.get(`${JUPITER_API_URL}/quote`, {
          params: {
            inputMint: tokenAddress,
            outputMint: 'So11111111111111111111111111111111111111112', // SOL
            amount: Math.floor(trade.amount * 1e9), // Convert amount to lamports (adjust as needed)
            slippageBps: 200 // 2% slippage
          }
        });

        if (quoteResponse.status !== 200 || !quoteResponse.data) {
          logger.error(`Failed to get sell quote for token ${trade.token.symbol}`);
          continue;
        }

        const swapResponse = await axios.post(`${JUPITER_API_URL}/swap`, {
          quoteResponse: quoteResponse.data,
          userPublicKey: walletKeypair.publicKey.toBase58(),
          wrapAndUnwrapSol: true
        });

        if (swapResponse.status !== 200 || !swapResponse.data) {
          logger.error(`Failed to execute sell swap for token ${trade.token.symbol}`);
          continue;
        }

        const swapTransaction = swapResponse.data.swapTransaction;
        const transaction = Transaction.from(Buffer.from(swapTransaction, 'base64'));
        const signature = await sendAndConfirmTransaction(connection, transaction, [walletKeypair]);

        logger.info(`Sell trade executed successfully for token ${trade.token.symbol}. Transaction signature: ${signature}`);

        // Remove the trade from activeTrades
        activeTrades.delete(tokenAddress);
      }
    }
  } catch (error) {
    logger.error(`Error monitoring market cap: ${error.message}`);
  }
};

// Add this to botService export
export default {
  startBot,
  stopBot,
  getBotStatus,
  updateBotSettings,
  getBotPerformance,
  addTokenToWatchlist,
  setupTradingAlerts,
  getNewTokenLaunches
};