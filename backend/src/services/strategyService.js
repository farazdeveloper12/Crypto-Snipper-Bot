// src/services/strategyService.js
import { logger } from '../utils/logger.js';
import marketDataService from './marketDataService.js';
import Strategy from '../models/Strategy.js';

class StrategyService {
  constructor() {
    this.strategies = new Map(); // strategyId -> strategy
  }

  // Load strategies for a user
  async loadStrategies(userId) {
    try {
      logger.info(`Loading strategies for user ${userId}`);
      
      // Fetch strategies from the database
      const strategies = await Strategy.find({ userId, isActive: true });
      
      // Store in memory for quick access
      strategies.forEach(strategy => {
        this.strategies.set(strategy.id, strategy);
      });
      
      logger.info(`Loaded ${strategies.length} active strategies`);
      return strategies;
    } catch (error) {
      logger.error(`Strategy loading error: ${error.message}`);
      throw new Error(`Failed to load strategies: ${error.message}`);
    }
  }

  // Create a new strategy
  async createStrategy(tokenAddress, txHash, amount, entryPrice, settings) {
    try {
      logger.info(`Creating strategy for token ${tokenAddress}`);
      
      // Create the strategy in the database
      const strategy = new Strategy({
        tokenAddress,
        entryTxHash: txHash,
        entryAmount: amount,
        entryPrice,
        currentPrice: entryPrice,
        takeProfitPrice: entryPrice * (1 + (settings.takeProfit / 100)),
        stopLossPrice: entryPrice * (1 - (settings.stopLoss / 100)),
        isActive: true,
        createdAt: Date.now()
      });
      
      await strategy.save();
      
      // Add to in-memory map
      this.strategies.set(strategy.id, strategy);
      
      // Continuing from where we left off in strategyService.js

      logger.info(`Strategy created with ID ${strategy.id}`);
      return strategy;
    } catch (error) {
      logger.error(`Strategy creation error: ${error.message}`);
      throw new Error(`Failed to create strategy: ${error.message}`);
    }
  }

  // Stop a strategy
  async stopStrategy(strategyId) {
    try {
      logger.info(`Stopping strategy ${strategyId}`);
      
      // Find and update in database
      const strategy = await Strategy.findByIdAndUpdate(
        strategyId,
        { isActive: false, closedAt: Date.now() },
        { new: true }
      );
      
      if (!strategy) {
        throw new Error('Strategy not found');
      }
      
      // Remove from in-memory map
      this.strategies.delete(strategyId);
      
      logger.info(`Strategy ${strategyId} stopped`);
      return strategy;
    } catch (error) {
      logger.error(`Strategy stop error: ${error.message}`);
      throw new Error(`Failed to stop strategy: ${error.message}`);
    }
  }

  // Evaluate if auto-buy should be triggered
  async evaluateAutoBuy(token, settings) {
    try {
      // Simple evaluation based on token age and liquidity
      // In production, use more sophisticated analysis
      
      // Skip if token is too old (>1 day)
      const tokenAge = Date.now() - token.launchTime;
      if (tokenAge > 24 * 60 * 60 * 1000) {
        return false;
      }
      
      // Check sentiment if available
      let sentimentScore = 0;
      try {
        const sentiment = await marketDataService.getTokenSentiment(token.symbol);
        sentimentScore = sentiment.score;
      } catch (error) {
        logger.warn(`Sentiment analysis failed for ${token.symbol}: ${error.message}`);
      }
      
      // Combined score (simple version)
      const score = Math.random() + sentimentScore; // Random for demo
      
      // Decision threshold
      return score > 0.7; // 30% chance of auto-buy
    } catch (error) {
      logger.error(`Auto-buy evaluation error: ${error.message}`);
      return false; // Default to no auto-buy on error
    }
  }

  // Evaluate exit conditions (take profit, stop loss)
  async evaluateExitConditions(strategy, currentPrice, settings) {
    try {
      // Update current price in strategy
      strategy.currentPrice = currentPrice;
      
      // Calculate profit/loss
      const profitPercentage = ((currentPrice - strategy.entryPrice) / strategy.entryPrice) * 100;
      strategy.profitPercentage = profitPercentage;
      
      // Check if take profit or stop loss is hit
      const takeProfitHit = profitPercentage >= settings.takeProfit;
      const stopLossHit = profitPercentage <= -settings.stopLoss;
      
      // Execute sell if conditions are met
      if (takeProfitHit) {
        logger.info(`Take profit hit for strategy ${strategy.id}: ${profitPercentage.toFixed(2)}%`);
        await this.executeSell(strategy, 'take_profit');
        return true;
      }
      
      if (stopLossHit) {
        logger.info(`Stop loss hit for strategy ${strategy.id}: ${profitPercentage.toFixed(2)}%`);
        await this.executeSell(strategy, 'stop_loss');
        return true;
      }
      
      // Update strategy in database
      await Strategy.findByIdAndUpdate(strategy.id, {
        currentPrice,
        profitPercentage
      });
      
      return false;
    } catch (error) {
      logger.error(`Exit conditions evaluation error: ${error.message}`);
      return false;
    }
  }

  // Execute a buy trade
  async executeBuy(tokenAddress, amount, slippage) {
    try {
      logger.info(`Executing buy for ${tokenAddress}, amount: ${amount} SOL, slippage: ${slippage}%`);
      
      // This is a placeholder - in production, integrate with DEX
      // For demo, we'll simulate a successful buy
      
      const success = Math.random() > 0.2; // 80% success rate
      
      if (!success) {
        return {
          success: false,
          error: 'Transaction failed'
        };
      }
      
      // Mock transaction result
      const mockTxHash = '0x' + Math.random().toString(16).substring(2, 34);
      const mockPrice = 0.0001 + (Math.random() * 0.0001);
      
      return {
        success: true,
        txHash: mockTxHash,
        amount,
        entryPrice: mockPrice,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Buy execution error: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Execute a sell trade
  async executeSell(strategy, reason) {
    try {
      logger.info(`Executing sell for strategy ${strategy.id}, reason: ${reason}`);
      
      // This is a placeholder - in production, integrate with DEX
      // For demo, we'll simulate a successful sell
      
      const success = Math.random() > 0.1; // 90% success rate
      
      if (!success) {
        logger.error(`Sell failed for strategy ${strategy.id}`);
        return false;
      }
      
      // Mock transaction result
      const mockTxHash = '0x' + Math.random().toString(16).substring(2, 34);
      
      // Update strategy status
      strategy.isActive = false;
      strategy.exitReason = reason;
      strategy.exitTxHash = mockTxHash;
      strategy.exitPrice = strategy.currentPrice;
      strategy.closedAt = Date.now();
      
      // Save to database
      await Strategy.findByIdAndUpdate(strategy.id, {
        isActive: false,
        exitReason: reason,
        exitTxHash: mockTxHash,
        exitPrice: strategy.currentPrice,
        closedAt: Date.now()
      });
      
      // Remove from active strategies
      this.strategies.delete(strategy.id);
      
      logger.info(`Sell executed for strategy ${strategy.id}, tx: ${mockTxHash}`);
      return true;
    } catch (error) {
      logger.error(`Sell execution error: ${error.message}`);
      return false;
    }
  }
}

const strategyService = new StrategyService();
export default strategyService;