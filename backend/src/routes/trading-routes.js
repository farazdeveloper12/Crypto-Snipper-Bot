// backend/src/routes/trading-routes.js
import express from 'express';
import { TradingController } from '../controllers/trade-controller.js';
import authMiddleware from '../middlewares/auth-middleware.js';
import tradingService from '../services/tradingService.js';
import Trade from '../models/trade.js';

const router = express.Router();

// Route to fetch trades
router.get('/trades', async (req, res) => {
  try {
    const trades = await Trade.find().sort({ timestamp: -1 }).limit(10);
    res.status(200).json(trades);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Route to execute a trade
router.post('/trade', async (req, res) => {
  const { token, action } = req.body;
  if (!token || !action) {
    return res.status(400).json({ status: "error", message: "Token and action are required!" });
  }

  try {
    const result = await tradingService.autoTrade(token, action);
    res.json({ status: "success", message: "Trade executed", result });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Protect all trading routes
router.use(authMiddleware.authenticate);

// Trading strategies
router.post('/execute-snipe', TradingController.executeSnipe);
router.post('/create-strategy', TradingController.createTradingStrategy);
router.get('/strategies', TradingController.getUserStrategies);
router.put('/strategy/:id', TradingController.updateTradingStrategy);
router.delete('/strategy/:id', TradingController.deleteTradingStrategy);

// Automated trading route
router.post('/automated-trading', async (req, res) => {
  try {
    const { tokenAddress, amount, chain, walletIndex } = req.body;
    
    if (!tokenAddress || !amount) {
      return res.status(400).json({ 
        status: "error", 
        message: "Token address and amount are required!" 
      });
    }
    
    const result = await tradingService.executeBuyTransaction(
      req.user.id,
      tokenAddress,
      amount,
      chain || 'solana',
      walletIndex || 0
    );
    
    res.status(200).json({ 
      status: "success",
      message: 'Automated trading started successfully',
      result
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
});

// Trade management routes
router.post('/execute-trade', async (req, res) => {
  try {
    const { tokenAddress, amount, type, blockchain } = req.body;
    
    if (!tokenAddress || !amount || !type) {
      return res.status(400).json({
        status: "error",
        message: "Token address, amount, and type are required"
      });
    }
    
    let result;
    if (type.toUpperCase() === 'BUY') {
      result = await tradingService.executeBuyTransaction(
        req.user.id,
        tokenAddress,
        amount,
        blockchain || 'solana'
      );
    } else if (type.toUpperCase() === 'SELL') {
      result = await tradingService.executeSellTransaction(
        req.user.id,
        tokenAddress,
        amount,
        blockchain || 'solana'
      );
    } else {
      return res.status(400).json({
        status: "error",
        message: "Type must be either BUY or SELL"
      });
    }
    
    res.json({
      status: "success",
      message: 'Trade executed successfully',
      result
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

router.get('/trade-history', async (req, res) => {
  try {
    res.json({
      status: "success",
      message: "Trade history feature available soon"
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

router.post('/close-trade', async (req, res) => {
  try {
    const { tradeId, tokenAddress, amount, chain } = req.body;
    
    if (!tokenAddress || !amount) {
      return res.status(400).json({
        status: "error",
        message: "Token address and amount are required"
      });
    }
    
    const result = await tradingService.executeSellTransaction(
      req.user.id,
      tokenAddress,
      amount,
      chain || 'solana'
    );
    
    res.json({
      status: "success",
      message: 'Trade closed successfully',
      result
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

router.post('/set-trade-size', async (req, res) => {
  try {
    const { tradeSize } = req.body;
    const userId = req.body.userId || 'default-user';
    
    if (!tradeSize) {
      return res.status(400).json({
        status: 'error',
        message: 'Trade size is required'
      });
    }
    
    logger.info(`Setting trade size for user ${userId}: ${tradeSize} SOL`);
    
    const botInstance = botController.activeInstances.get(userId);
    if (!botInstance) {
      return res.status(400).json({
        status: 'error',
        message: 'No active bot for this user'
      });
    }
    
    const parsedTradeSize = parseFloat(tradeSize);
    botInstance.settings.maxTradeAmount = parsedTradeSize;
    autoTrader.updateSettings({
      maxTradeSizeSOL: parsedTradeSize
    });
    
    logger.info(`Updated trade size for user ${userId} to ${parsedTradeSize} SOL`);
    
    return res.json({
      status: 'success',
      message: `Trade size updated to ${parsedTradeSize} SOL`,
      settings: botInstance.settings
    });
  } catch (error) {
    logger.error(`Set trade size error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: `Failed to set trade size: ${error.message}`
    });
  }
});

router.get('/trading-stats', async (req, res) => {
  try {
    const stats = await tradingService.getTradingStats(req.user.id);
    res.json({ 
      status: "success", 
      data: stats 
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const userId = req.body.userId || 'default-user';
    
    logger.info(`Updating settings for user ${userId}: ${JSON.stringify(req.body)}`);
    
    const settings = {
      maxTradeAmount: parseFloat(req.body.maxTradeAmount) || 0.01,
      slippage: parseInt(req.body.slippage) || 3,
      takeProfit: parseInt(req.body.takeProfit) || 50,
      stopLoss: parseInt(req.body.stopLoss) || 10,
      scamDetection: req.body.scamDetection !== undefined ? req.body.scamDetection : true,
      trailingStopLoss: req.body.trailingStopLoss || false,
      gasMultiplier: req.body.gasMultiplier || 1.5
    };
    
    const result = await botController.updateBotSettings(userId, settings);
    
    return res.json(result);
  } catch (error) {
    logger.error(`Settings update error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: `Failed to update settings: ${error.message}`
    });
  }
});

router.get('/active-trades', async (req, res) => {
  try {
    const activeTrades = await tradingService.getActiveTrades(req.user.id);
    res.json({ 
      status: "success", 
      data: activeTrades 
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
});

router.post('/monitor-token', async (req, res) => {
  try {
    const { tokenAddress, stopLoss, takeProfit } = req.body;
    
    if (!tokenAddress) {
      return res.status(400).json({ 
        status: "error", 
        message: "Token address is required" 
      });
    }
    
    res.json({ 
      status: "success", 
      message: `Monitoring started for token ${tokenAddress}`,
      details: { tokenAddress, stopLoss, takeProfit }
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
});

router.get('/token-alerts', async (req, res) => {
  try {
    res.json({ 
      status: "success", 
      data: [] 
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
});

export default router;