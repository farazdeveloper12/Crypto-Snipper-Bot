// backend/src/controllers/trade-controller.js

import tradingService from '../services/tradingService.js'; // ✅ Correct import
import TradeModel from '../models/trade.js'; // Ensure correct ES Module import
import Logger from '../utils/logger.js'; // Ensure logger import is correct

class TradeController {
  constructor() {
    this.tradingService = tradingService; // Use the imported service
    this.logger = new Logger('trade-controller');
  }

  // Execute manual trade
  async executeTrade(req, res) {
    try {
      const { tokenAddress, amount, type, blockchain, strategy } = req.body;

      // Handle buy or sell based on type
      let tradeResult;
      if (type === 'BUY') {
        tradeResult = await this.tradingService.executeBuyTransaction(
          req.user.id,
          tokenAddress,
          amount,
          blockchain || 'solana',
          0 // Default wallet index
        );
      } else if (type === 'SELL') {
        tradeResult = await this.tradingService.executeSellTransaction(
          req.user.id,
          tokenAddress,
          amount,
          blockchain || 'solana',
          0 // Default wallet index
        );
      } else {
        return res.status(400).json({
          error: 'Invalid trade type. Must be BUY or SELL'
        });
      }

      res.json({
        message: 'Trade executed successfully',
        trade: tradeResult
      });
    } catch (error) {
      this.logger.error('Trade execution failed', error);
      res.status(500).json({ 
        error: 'Trade execution failed', 
        details: error.message 
      });
    }
  }

  // Get user's trade history
  async getTradeHistory(req, res) {
    try {
      const { limit = 50, offset = 0, status } = req.query;

      const trades = await TradeModel.find({ 
        user: req.user.id,
        ...(status && { status }) 
      })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset))
      .populate('token');

      const total = await TradeModel.countDocuments({ 
        user: req.user.id,
        ...(status && { status }) 
      });

      res.json({
        trades,
        total,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      this.logger.error('Trade history fetch failed', error);
      res.status(500).json({ 
        error: 'Failed to fetch trade history', 
        details: error.message 
      });
    }
  }

  // Close an active trade
  async closeTrade(req, res) {
    try {
      const { tradeId } = req.body;

      // Use the tradingService to sell the token
      // This will need to be modified based on your actual data model
      // and how you're tracking active trades
      const trade = await TradeModel.findOne({
        _id: tradeId,
        user: req.user.id,
        status: 'ACTIVE'
      });

      if (!trade) {
        return res.status(404).json({
          error: 'Trade not found or already closed'
        });
      }

      // Execute sell transaction
      const closedTrade = await this.tradingService.executeSellTransaction(
        req.user.id,
        trade.tokenAddress,
        trade.amount,
        trade.blockchain,
        trade.walletIndex
      );

      // Update trade status
      trade.status = 'CLOSED';
      await trade.save();

      res.json({
        message: 'Trade closed successfully',
        trade: closedTrade
      });
    } catch (error) {
      this.logger.error('Trade closure failed', error);
      res.status(500).json({ 
        error: 'Failed to close trade', 
        details: error.message 
      });
    }
  }
}

// TradingController definition for strategy operations
export const TradingController = {
  async executeSnipe(req, res) {
    try {
      const { token, amount } = req.body;
      if (!token || !amount) {
        return res.status(400).json({ error: "Token and amount are required!" });
      }
      
      const result = await tradingService.executeBuyTransaction(req.user.id, token, amount);
      res.json({ status: "success", message: "Snipe trade executed", result });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  },

  async createTradingStrategy(req, res) {
    try {
      const { strategyName, conditions } = req.body;
      if (!strategyName || !conditions) {
        return res.status(400).json({ error: "Strategy name and conditions are required!" });
      }

      // Since tradingService doesn't have createStrategy, we'll mock it
      // This would need to be implemented in your tradingService
      const strategy = {
        id: Math.random().toString(36).substring(7),
        name: strategyName,
        conditions,
        userId: req.user.id,
        createdAt: new Date()
      };

      res.json({ status: "success", message: "Strategy created", result: strategy });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  },

  async getUserStrategies(req, res) {
    try {
      // Since tradingService doesn't have getUserStrategies, we'll mock it
      // This would need to be implemented in your tradingService
      const strategies = []; // Mock empty array
      
      res.json({ status: "success", data: strategies });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  },

  async updateTradingStrategy(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Since tradingService doesn't have updateStrategy, we'll mock it
      // This would need to be implemented in your tradingService
      const strategy = {
        id,
        ...updates,
        userId: req.user.id,
        updatedAt: new Date()
      };
      
      res.json({ status: "success", message: "Strategy updated", result: strategy });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  },

  async deleteTradingStrategy(req, res) {
    try {
      const { id } = req.params;
      
      // Since tradingService doesn't have deleteStrategy, we'll mock it
      // This would need to be implemented in your tradingService
      
      res.json({ 
        status: "success", 
        message: "Strategy deleted", 
        result: { id, deleted: true } 
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
};

// Export the default controller
export default TradeController;