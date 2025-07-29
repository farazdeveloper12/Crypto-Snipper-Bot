// src/routes/botRoutes.js
import express from 'express';
import logger from '../utils/logger.js';
import botController from '../controllers/botController.js';

const router = express.Router();

// Initialize the bot controller
botController.initialize().catch(err => {
  logger.error(`Failed to initialize bot controller: ${err.message}`);
});

// Store a global reference to the botStatus map for easier access
// This should be persisted to a database in a production environment
global.botStatus = global.botStatus || new Map();

// Sample bot settings
const defaultBotSettings = {
  maxTradeAmount: 0.1, // SOL
  slippage: 3, // %
  takeProfit: 50, // %
  stopLoss: 10, // %
  scamDetection: true,
  activeTokens: []
};

// Manual trading trigger endpoint
router.post('/trigger-trade', (req, res) => {
  const { tokenAddress, amount, type } = req.body;
  if (!tokenAddress) {
    return res.status(400).json({
      status: 'error',
      message: 'Token address is required'
    });
  }
  
  // Default to buy if not specified
  const tradeType = type || 'buy';
  const tradeAmount = amount || 0.01; // Default to small amount
  
  // Create a manual trade signal
  const botInstance = botController.getActiveInstances().get('default-user');
  if (!botInstance) {
    return res.status(404).json({
      status: 'error',
      message: 'Bot not active'
    });
  }
  
  // Trigger a manual trade
  botController.triggerManualTrade(
    'default-user', 
    tokenAddress, 
    tradeAmount, 
    tradeType, 
    botInstance.settings.walletAddress
  );
  
  return res.json({
    status: 'success',
    message: `${tradeType.toUpperCase()} signal triggered for ${tokenAddress}`,
    amount: tradeAmount
  });
});

/**
 * @route   POST /api/bot/start
 * @desc    Start trading bot
 * @access  Public (removed auth for testing)
 */
router.post('/start', async (req, res) => {
  try {
    // For testing purposes, use a fixed user ID
    const userId = "default-user";
    
    // Get the wallet address from the request
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      logger.error(`No wallet address provided for bot start request`);
      return res.status(400).json({
        status: 'error',
        message: 'Wallet address is required to start the bot'
      });
    }
    
    logger.info(`Received request to start bot with wallet: ${walletAddress}`);
    
    // Get custom settings if provided
    const customSettings = req.body.settings || {};
    
    // Merge with default settings
    const settings = {
      ...defaultBotSettings,
      ...customSettings,
      walletAddress
    };
    
    // Start the bot with the controller
    const result = await botController.startBot(userId, settings, walletAddress);
    
    if (result.status === 'success') {
      // Update global status map
      global.botStatus.set(userId, {
        status: 'active',
        startTime: new Date(),
        settings: settings,
        trades: [],
        performance: {
          totalTrades: 0,
          successfulTrades: 0,
          totalProfit: 0,
          averageROI: 0
        }
      });
      
      // Log success
      logger.info(`Bot started for user ${userId}`);
      console.log(`Bot started for user ${userId}`);
      console.log(`Current bot status map:`, Array.from(global.botStatus.entries()));
    }
    
    res.json({
      status: 'success',
      message: 'Bot started successfully',
      data: {
        botStatus: 'active',
        settings
      }
    });
  } catch (error) {
    logger.error(`Start bot error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Server error starting bot'
    });
  }
});

/**
 * @route   POST /api/bot/direct-trade
 * @desc    Execute a direct trade with a specific token
 * @access  Public
 */
router.post('/direct-trade', async (req, res) => {
  try {
    const { tokenAddress, amount } = req.body;
    const userId = req.body.userId || 'default-user';
    
    if (!tokenAddress) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Token address is required' 
      });
    }
    
    // Get bot instance
    const botInstance = botController.activeInstances.get(userId);
    if (!botInstance) {
      return res.status(400).json({
        status: 'error',
        message: 'No active bot for this user'
      });
    }
    
    // Log what we're doing
    logger.info(`🔅 DIRECT TRADE: Token=${tokenAddress}, Amount=${amount || 0.01} SOL`);
    
    // Execute buy directly
    const result = await autoTrader.executeBuy(
      tokenAddress,
      parseFloat(amount) || 0.01,
      botInstance.settings.walletAddress,
      'solana'
    );
    
    return res.json({
      status: result.success ? 'success' : 'error',
      message: result.success ? 'Trade executed successfully' : (result.error || 'Trade failed'),
      data: result
    });
  } catch (error) {
    logger.error(`Direct trade error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: `Failed to execute trade: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/bot/direct-buy
 * @desc    Execute a direct buy of a specific token
 * @access  Public
 */
router.post('/direct-buy', async (req, res) => {
  try {
    const { tokenAddress } = req.body;
    const userId = req.body.userId || 'default-user';
    
    if (!tokenAddress) {
      return res.status(400).json({
        status: 'error',
        message: 'Token address is required'
      });
    }
    
    // Find the bot instance
    const botInstance = botController.activeInstances.get(userId);
    if (!botInstance) {
      return res.status(400).json({
        status: 'error',
        message: 'No active bot found for this user'
      });
    }
    
    // Get trade amount from bot settings
    const tradeAmount = botInstance.settings.maxTradeAmount || 0.01;
    
    logger.info(`🔵 EXECUTING DIRECT BUY: ${tradeAmount} SOL for ${tokenAddress}`);
    
    // Call executeBuy directly
    const result = await autoTrader.executeBuy(
      tokenAddress,
      tradeAmount,
      botInstance.settings.walletAddress,
      'solana'
    );
    
    if (result.success) {
      logger.info(`✅ BUY SUCCESSFUL: ${tokenAddress} at price ${result.price}`);
      
      // Add to active trades for monitoring
      autoTrader.activeTrades.set(tokenAddress, {
        tokenAddress,
        entryPrice: result.price,
        entryTime: new Date(),
        amount: result.amount,
        solAmount: tradeAmount,
        chain: 'solana',
        takeProfit: result.price * (1 + botInstance.settings.takeProfit / 100),
        stopLoss: result.price * (1 - botInstance.settings.stopLoss / 100),
        lastChecked: new Date(),
        walletAddress: botInstance.settings.walletAddress,
        tradeId: `trade-${Date.now()}`,
        status: 'active',
        txHash: result.txHash,
        performance: {
          highestPrice: result.price,
          highestPriceTime: new Date(),
          lowestPrice: result.price,
          lowestPriceTime: new Date(),
          currentPrice: result.price,
          currentPnL: 0,
          currentPnLPercent: 0
        }
      });
    }
    
    return res.json({
      status: result.success ? 'success' : 'error',
      message: result.success ? 'Buy executed successfully' : `Buy failed: ${result.error}`,
      data: result
    });
  } catch (error) {
    logger.error(`Direct buy error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: `Failed to execute buy: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/bot/direct-sell
 * @desc    Execute a direct sell of a specific token
 * @access  Public
 */
router.post('/direct-sell', async (req, res) => {
  try {
    const { tokenAddress } = req.body;
    const userId = req.body.userId || 'default-user';
    
    if (!tokenAddress) {
      return res.status(400).json({
        status: 'error',
        message: 'Token address is required'
      });
    }
    
    // Find the bot instance
    const botInstance = botController.activeInstances.get(userId);
    if (!botInstance) {
      return res.status(400).json({
        status: 'error',
        message: 'No active bot found for this user'
      });
    }
    
    // Check if there's an active trade for this token
    const activeTrade = autoTrader.activeTrades.get(tokenAddress);
    if (!activeTrade) {
      return res.status(400).json({
        status: 'error',
        message: 'No active trade found for this token'
      });
    }
    
    logger.info(`🔴 EXECUTING DIRECT SELL: ${activeTrade.amount} of ${tokenAddress}`);
    
    // Call executeSell directly
    const result = await autoTrader.executeSell(
      tokenAddress,
      activeTrade.amount,
      botInstance.settings.walletAddress,
      'solana'
    );
    
    if (result.success) {
      logger.info(`✅ SELL SUCCESSFUL: ${tokenAddress} at price ${result.price}`);
      
      // Remove from active trades
      autoTrader.activeTrades.delete(tokenAddress);
    }
    
    return res.json({
      status: result.success ? 'success' : 'error',
      message: result.success ? 'Sell executed successfully' : `Sell failed: ${result.error}`,
      data: result
    });
  } catch (error) {
    logger.error(`Direct sell error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: `Failed to execute sell: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/bot/trade-token
 * @desc    Execute a direct trade with a specific token
 * @access  Public
 */
router.post('/trade-token', async (req, res) => {
  try {
    const { tokenAddress } = req.body;
    const userId = req.body.userId || 'default-user';
    
    if (!tokenAddress) {
      return res.status(400).json({
        status: 'error',
        message: 'Token address is required'
      });
    }
    
    // Get bot instance
    const botInstance = botController.activeInstances.get(userId);
    if (!botInstance) {
      return res.status(400).json({
        status: 'error',
        message: 'No active bot for this user'
      });
    }
    
    const tradeAmount = botInstance.settings.maxTradeAmount || 0.01;
    logger.info(`🔵 DIRECT TRADE REQUESTED: ${tradeAmount} SOL for ${tokenAddress}`);
    
    // Create a direct trade
    const result = await autoTrader.executeBuy(
      tokenAddress,
      tradeAmount,
      botInstance.settings.walletAddress,
      'solana'
    );
    
    if (result.success) {
      // Add to active trades
      autoTrader.activeTrades.set(tokenAddress, {
        tokenAddress,
        entryPrice: result.price,
        entryTime: new Date(),
        amount: result.amount,
        solAmount: tradeAmount,
        chain: 'solana',
        takeProfit: result.price * (1 + botInstance.settings.takeProfit / 100),
        stopLoss: result.price * (1 - botInstance.settings.stopLoss / 100),
        lastChecked: new Date(),
        walletAddress: botInstance.settings.walletAddress,
        tradeId: result.tradeId,
        status: 'active',
        txHash: result.txHash
      });
    }
    
    return res.json({
      status: result.success ? 'success' : 'error',
      message: result.success ? 'Trade executed successfully' : result.error,
      result
    });
  } catch (error) {
    logger.error(`Direct trade error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: `Failed to execute trade: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/bot/stop
 * @desc    Stop trading bot
 * @access  Public (removed auth for testing)
 */
router.post('/stop', async (req, res) => {
  try {
    // For testing purposes, use a fixed user ID
    const userId = "default-user";
    
    console.log(`Attempting to stop bot for user ${userId}`);
    
    // Stop the bot with the controller
    const result = await botController.stopBot(userId);
    
    // Check if bot is running for this user
    const bot = global.botStatus.get(userId);
    
    if (!bot) {
      console.log(`No bot found for user ${userId}`);
      return res.status(400).json({
        status: 'error',
        message: 'Bot is not currently active'
      });
    }
    
    if (bot.status !== 'active') {
      console.log(`Bot for user ${userId} is not active`);
      return res.status(400).json({
        status: 'error',
        message: 'Bot is not currently active'
      });
    }
    
    // Update bot status
    bot.status = 'inactive';
    bot.stopTime = new Date();
    global.botStatus.set(userId, bot);
    
    // Log the event
    logger.info(`Bot stopped for user ${userId}`);
    console.log(`Bot stopped for user ${userId}`);
    
    res.json({
      status: 'success',
      message: 'Bot stopped successfully',
      data: {
        botStatus: 'inactive',
        runTime: (bot.stopTime - bot.startTime) / 1000, // in seconds
        performance: bot.performance
      }
    });
  } catch (error) {
    logger.error(`Stop bot error: ${error.message}`);
    console.error(`Stop bot error:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Server error stopping bot'
    });
  }
});

/**
 * @route   GET /api/bot/status
 * @desc    Get bot status
 * @access  Public (removed auth for testing)
 */
router.get('/status', (req, res) => {
  try {
    // For testing purposes, use a fixed user ID
    const userId = "default-user";
    
    // Get bot status from controller
    const status = botController.getBotStatus(userId);
    
    // Get bot status
    const bot = global.botStatus.get(userId);
    
    if (!bot) {
      return res.json({
        status: 'success',
        data: {
          botStatus: 'inactive',
          settings: defaultBotSettings
        }
      });
    }
    
    // Update global status map for monitoring
    global.botStatus.set(userId, {
      ...bot,
      lastUpdate: new Date()
    });
    
    res.json({
      status: 'success',
      data: {
        botStatus: bot.status,
        settings: bot.settings,
        performance: bot.performance,
        startTime: bot.startTime,
        stopTime: bot.stopTime
      }
    });
  } catch (error) {
    logger.error(`Get bot status error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching bot status'
    });
  }
});

/**
 * @route   PUT /api/bot/settings
 * @desc    Update bot settings
 * @access  Public (removed auth for testing)
 */
router.put('/settings', async (req, res) => {
  try {
    // For testing purposes, use a fixed user ID
    const userId = "default-user";
    
    // Log the update request
    logger.info(`Received bot settings update request for user ${userId}`);
    console.log(`Settings update request:`, req.body);
    
    // Normalize settings to handle different naming conventions
    const settings = {
      maxTradeAmount: req.body.maxTradeAmount,
      maxTrade: req.body.maxTrade,
      slippage: req.body.slippage,
      takeProfit: req.body.takeProfit, 
      stopLoss: req.body.stopLoss,
      scamDetection: req.body.scamDetection
    };
    
    // Update settings with controller if available
    let updatedSettings;
    if (typeof botController.updateBotSettings === 'function') {
      const result = botController.updateBotSettings(userId, settings);
      updatedSettings = result.settings || settings;
    } else {
      // Get the bot instance from global status
      const bot = global.botStatus.get(userId);
      
      if (!bot) {
        return res.status(400).json({
          status: 'error',
          message: 'No active bot found for this user'
        });
      }
      
      // Update the settings
      updatedSettings = {
        ...bot.settings,
        ...settings
      };
      
      // Save updated settings
      bot.settings = updatedSettings;
      global.botStatus.set(userId, bot);
    }
    
    // Log the update
    logger.info(`Bot settings updated for user ${userId}`);
    console.log(`New settings:`, updatedSettings);
    
    // Return success response
    res.json({
      status: 'success',
      message: 'Bot settings updated successfully',
      data: {
        settings: updatedSettings
      }
    });
  } catch (error) {
    logger.error(`Update bot settings error: ${error.message}`);
    console.error(`Update settings error:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating bot settings'
    });
  }
});

/**
 * @route   GET /api/bot/performance
 * @desc    Get bot performance metrics
 * @access  Public (removed auth for testing)
 */
router.get('/performance', (req, res) => {
  try {
    // For testing purposes, use a fixed user ID
    const userId = "default-user";
    
    // Get performance from controller if available
    let performance;
    if (typeof botController.getBotPerformance === 'function') {
      performance = botController.getBotPerformance(userId);
    } else {
      // Get bot status from global
      const bot = global.botStatus.get(userId);
      
      if (!bot) {
        performance = {
          performance: {
            totalTrades: 0,
            successfulTrades: 0,
            totalProfit: 0,
            averageROI: 0
          },
          trades: []
        };
      } else {
        performance = {
          performance: bot.performance,
          trades: bot.trades || []
        };
      }
    }
    
    // Return performance metrics
    res.json({
      status: 'success',
      data: performance
    });
  } catch (error) {
    logger.error(`Get bot performance error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching bot performance'
    });
  }
});

/**
 * @route   GET /api/bot/signals
 * @desc    Get trading signals
 * @access  Public (removed auth for testing)
 */
router.get('/signals', (req, res) => {
  try {
    // For testing purposes, use a fixed user ID
    const userId = "default-user";
    
    // Get signals from controller if available
    let signals;
    if (typeof botController.getTradingSignals === 'function') {
      signals = botController.getTradingSignals(userId);
    } else {
      signals = {
        status: 'success',
        signals: []
      };
    }
    
    return res.json(signals);
  } catch (error) {
    logger.error(`Get trading signals error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching trading signals'
    });
  }
});

/**
 * @route   GET /api/bot/trades
 * @desc    Get all trades
 * @access  Public (removed auth for testing)
 */
router.get('/trades', (req, res) => {
  try {
    // For testing purposes, use a fixed user ID
    const userId = "default-user";
    
    // Get trades from controller if available
    let trades;
    if (typeof botController.getActiveTrades === 'function') {
      trades = botController.getActiveTrades(userId);
    } else {
      trades = {
        status: 'success',
        trades: []
      };
    }
    
    return res.json(trades);
  } catch (error) {
    logger.error(`Get active trades error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching active trades'
    });
  }
});

/**
 * @route   GET /api/bot/active-trades
 * @desc    Get active trades
 * @access  Public
 */
router.get('/active-trades', async (req, res) => {
  try {
    const { userId = 'default-user' } = req.query;
    const activeTrades = botController.getActiveTrades(userId);
    res.json(activeTrades);
  } catch (error) {
    logger.error('Error getting active trades:', error);
    res.status(500).json({ error: 'Failed to get active trades' });
  }
});

/**
 * @route   POST /api/bot/trade
 * @desc    Execute a manual trade
 * @access  Public
 */
router.post('/trade', async (req, res) => {
  try {
    const { userId = 'default-user', tokenAddress, amount, type, walletAddress } = req.body;
    
    if (!tokenAddress || !amount || !type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: tokenAddress, amount, type' 
      });
    }
    
    const result = await botController.triggerManualTrade(
      userId,
      tokenAddress,
      amount,
      type,
      walletAddress
    );
    
    res.json(result);
  } catch (error) {
    logger.error('Error executing manual trade:', error);
    res.status(500).json({ success: false, error: 'Failed to execute trade' });
  }
});

/**
 * @route   POST /api/bot/copy-trading
 * @desc    Configure copy trading
 * @access  Public
 */
router.post('/copy-trading', async (req, res) => {
  try {
    const { userId = 'default-user', enabled, whaleWallets = [] } = req.body;
    const result = botController.configureCopyTrading(userId, enabled, whaleWallets);
    res.json(result);
  } catch (error) {
    logger.error('Error configuring copy trading:', error);
    res.status(500).json({ error: 'Failed to configure copy trading' });
  }
});

export default router;