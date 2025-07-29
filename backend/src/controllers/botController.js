// src/controllers/botController.js
import { Connection, PublicKey } from '@solana/web3.js';
import logger from '../utils/logger.js';
import walletService from '../services/walletService.js';
import tradingService from '../services/tradingService.js';
import quickNodeScanner from '../services/quicknode-scanner.js';
import axios from 'axios';

// Trade model with fallback
let Trade;
try {
  Trade = (await import('../models/trade.js')).default;
} catch (error) {
  logger.warn('Trade model not found, using in-memory storage');
  Trade = class {
    constructor(data) {
      this._id = `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      Object.assign(this, data);
    }
    async save() {
      return this;
    }
    toObject() {
      return { ...this };
    }
    static async find(query) {
      return [];
    }
    static async findByIdAndUpdate(id, update) {
      return { ...update, _id: id };
    }
  };
}

class BotController {
  constructor() {
    this.activeInstances = new Map();
    this.activeTrades = new Map();
    this.processedTokens = new Set();
    this.config = {
      defaultMaxTradeAmount: 0.01,
      defaultSlippage: 10,
      defaultTakeProfit: 50,
      defaultStopLoss: 20,
      defaultScamDetection: true,
      defaultGasMultiplier: 1.5,
      monitorInterval: 10000, // 10 seconds
    };
    this.solanaConnection = null;
  }

  async initialize() {
    try {
      this.solanaConnection = new Connection(
        process.env.SOLANA_RPC_URL || 'https://clean-sleek-sea.solana-mainnet.quiknode.pro/8b2d195b879ceb49d31244c7a836795c19119d95/'
      );
      await quickNodeScanner.initialize();
      
      // Start position monitoring
      setInterval(() => this.monitorPositions(), this.config.monitorInterval);
      
      logger.info('Bot controller initialized with QuickNode');
      return true;
    } catch (error) {
      logger.error(`Bot controller initialization failed: ${error.message}`);
      return false;
    }
  }

  async startBot(userId, settings = {}, walletAddress) {
    try {
      if (this.activeInstances.has(userId)) {
        logger.info(`Bot already running for user ${userId}`);
        return {
          status: 'success',
          message: 'Bot is already running for this user',
          botStatus: 'active',
          settings: this.activeInstances.get(userId).settings
        };
      }

      if (!walletAddress && settings.walletAddress) {
        walletAddress = settings.walletAddress;
      }

      if (!walletAddress) {
        logger.error(`No wallet address provided for user ${userId}`);
        return {
          status: 'error',
          message: 'Wallet address is required to start the bot'
        };
      }

      try {
        new PublicKey(walletAddress);
      } catch (error) {
        logger.error(`Invalid wallet address for user ${userId}: ${walletAddress}`);
        return {
          status: 'error',
          message: 'Invalid wallet address'
        };
      }

      const balance = await this.solanaConnection.getBalance(new PublicKey(walletAddress));
      const solBalance = balance / 1e9;
      logger.info(`Connected to wallet: ${walletAddress} with balance: ${solBalance} SOL`);

      const maxTradeAmount = settings.maxTradeAmount
        ? parseFloat(settings.maxTradeAmount)
        : settings.maxTrade
        ? parseFloat(settings.maxTrade)
        : this.config.defaultMaxTradeAmount;

      if (isNaN(maxTradeAmount) || maxTradeAmount <= 0) {
        logger.error(`Invalid max trade amount: ${maxTradeAmount}`);
        return {
          status: 'error',
          message: 'Invalid max trade amount'
        };
      }

      const botSettings = {
        maxTradeAmount,
        slippage: parseInt(settings.slippage) || this.config.defaultSlippage,
        takeProfit: parseInt(settings.takeProfit) || this.config.defaultTakeProfit,
        stopLoss: parseInt(settings.stopLoss) || this.config.defaultStopLoss,
        scamDetection:
          settings.scamDetection !== undefined
            ? settings.scamDetection
            : this.config.defaultScamDetection,
        gasMultiplier: parseFloat(settings.gasMultiplier) || this.config.defaultGasMultiplier,
        walletAddress,
        walletBalance: solBalance,
      };

      const botInstance = {
        userId,
        settings: botSettings,
        startTime: new Date(),
        status: 'active',
        trades: [],
        performance: {
          totalTrades: 0,
          successfulTrades: 0,
          totalProfit: 0,
          averageROI: 0,
        },
        lastScan: null,
      };

      this.activeInstances.set(userId, botInstance);

      // Start QuickNode monitoring for this user
      await quickNodeScanner.startMonitoring(async (token) => {
        await this.processNewToken(userId, token);
      });

      logger.info(`✅ Bot started for user ${userId} with QuickNode real-time monitoring`);

      return {
        status: 'success',
        message: 'Bot started successfully with real-time monitoring',
        botStatus: 'active',
        settings: botSettings,
      };
    } catch (error) {
      logger.error(`Error starting bot for user ${userId}: ${error.message}`);
      return {
        status: 'error',
        message: `Failed to start bot: ${error.message}`,
      };
    }
  }

  async processNewToken(userId, token) {
    try {
      const botInstance = this.activeInstances.get(userId);
      if (!botInstance || botInstance.status !== 'active') {
        logger.warn(`Bot not active for user ${userId}`);
        return;
      }

      // Skip if already processed
      if (this.processedTokens.has(token.address)) {
        logger.debug(`Token ${token.symbol} already processed`);
        return;
      }

      logger.info(`🆕 Processing new token: ${token.symbol} (${token.name})`);
      logger.info(`   Age: ${token.ageInMinutes?.toFixed(1) || 'New'} minutes`);
      logger.info(`   Liquidity: $${token.liquidity?.usd || 0}`);
      logger.info(`   Market Cap: $${token.marketCap || 0}`);

      // Analyze the token
      const analysis = await this.analyzeToken(token);

      if (analysis.shouldTrade) {
        logger.info(`✅ ${token.symbol} PASSED all checks! Executing trade...`);

        // Check wallet balance
        const balanceInfo = await walletService.getWalletBalance(botInstance.settings.walletAddress);
        botInstance.settings.walletBalance = balanceInfo.balanceSol;

        if (balanceInfo.balanceSol < botInstance.settings.maxTradeAmount + 0.01) {
          logger.warn(`Insufficient balance (${balanceInfo.balanceSol} SOL) for trading`);
          return;
        }

        const tradeAmount = Math.min(
          botInstance.settings.maxTradeAmount,
          botInstance.settings.walletBalance * 0.05
        );

        // Execute trade
        const tradeResult = await tradingService.executeTrade(
          userId,
          token.address,
          tradeAmount,
          'buy',
          {
            chain: 'solana',
            slippage: botInstance.settings.slippage,
            gasMultiplier: botInstance.settings.gasMultiplier,
          }
        );

        if (tradeResult.success) {
          logger.info(`🎯 Successfully bought ${token.symbol}!`);
          logger.info(`📝 Transaction: ${tradeResult.transaction.signature}`);
          logger.info(`🔗 DexScreener: https://dexscreener.com/solana/${token.address}`);

          // Calculate targets
          const stopLossPrice = tradeResult.price * (1 - botInstance.settings.stopLoss / 100);
          const takeProfitPrice = tradeResult.price * (1 + botInstance.settings.takeProfit / 100);

          // Save trade
          const trade = await this.saveTrade({
            userId,
            tokenAddress: token.address,
            tokenSymbol: token.symbol,
            tokenName: token.name,
            action: 'buy',
            amount: tradeResult.amount,
            price: tradeResult.price,
            transactionId: tradeResult.transaction.signature,
            timestamp: new Date(tradeResult.timestamp),
            status: 'open',
            entryPrice: tradeResult.price,
            stopLoss: stopLossPrice,
            takeProfit: takeProfitPrice,
            dexScreenerUrl: `https://dexscreener.com/solana/${token.address}`,
            marketCap: token.marketCap,
            liquidity: token.liquidity?.usd,
            volume24h: token.volume?.h24,
            tokenAmount: tradeAmount / tradeResult.price,
          });

          // Track position
          this.activeTrades.set(trade._id.toString(), {
            ...trade.toObject(),
            userId,
            tokenInfo: token,
            tokenAmount: tradeAmount / tradeResult.price,
          });

          // Update bot stats
          botInstance.trades.push({
            id: trade._id.toString(),
            token: token.address,
            symbol: token.symbol,
            name: token.name,
            action: 'buy',
            amount: tradeResult.amount,
            price: tradeResult.price,
            timestamp: new Date(tradeResult.timestamp),
            signature: tradeResult.transaction.signature,
            stopLoss: stopLossPrice,
            takeProfit: takeProfitPrice,
            status: 'open',
            dexScreenerUrl: `https://dexscreener.com/solana/${token.address}`,
          });

          botInstance.performance.totalTrades += 1;
          botInstance.performance.successfulTrades += 1;
          this.activeInstances.set(userId, botInstance);

          // Mark as processed
          this.processedTokens.add(token.address);
        } else {
          logger.error(`Failed to buy ${token.symbol}: ${tradeResult.error}`);
        }
      } else {
        logger.info(`❌ ${token.symbol} failed analysis checks: ${analysis.reason}`);
        this.processedTokens.add(token.address);
      }
    } catch (error) {
      logger.error(`Error processing token ${token.symbol || 'unknown'}: ${error.message}`);
    }
  }

  async analyzeToken(token) {
    try {
      const analysis = {
        shouldTrade: false,
        reason: '',
        score: 0,
      };

      // Check 1: Token age (prefer very new tokens, <2 hours)
      const ageInMinutes = token.ageInMinutes || (Date.now() - new Date(token.pairCreatedAt)) / (1000 * 60);
      if (ageInMinutes > 120) {
        analysis.reason = `Token too old: ${ageInMinutes.toFixed(1)} minutes`;
        return analysis;
      }
      analysis.score += 25;

      // Check 2: Minimum liquidity ($1000)
      if (!token.liquidity?.usd || token.liquidity.usd < 1000) {
        analysis.reason = `Low liquidity: $${token.liquidity?.usd || 0}`;
        return analysis;
      }
      analysis.score += 20;

      // Check 3: Market cap range ($5k - $1M)
      if (token.marketCap && (token.marketCap < 5000 || token.marketCap > 1000000)) {
        analysis.reason = `Market cap out of range: $${token.marketCap}`;
        return analysis;
      }
      analysis.score += 20;

      // Check 4: Volume (minimum $1000)
      if (token.volume?.h24 && token.volume.h24 < 1000) {
        analysis.reason = `Low volume: $${token.volume.h24}`;
        return analysis;
      }
      analysis.score += 15;

      // Check 5: Buy/Sell ratio (prefer more buys)
      if (token.txns?.h24) {
        const totalTxns = token.txns.h24.buys + token.txns.h24.sells;
        if (totalTxns > 10) {
          const buyRatio = token.txns.h24.buys / totalTxns;
          if (buyRatio < 0.4) {
            analysis.reason = `Low buy ratio: ${(buyRatio * 100).toFixed(1)}%`;
            return analysis;
          }
          analysis.score += 10;
        }
      }

      // Check 6: Price trend (avoid sharp drops)
      if (token.priceChange?.h24 && token.priceChange.h24 < -20) {
        analysis.reason = `Price dropping too fast: ${token.priceChange.h24}%`;
        return analysis;
      }
      analysis.score += 10;

      // Token passed all checks
      if (analysis.score >= 80) {
        analysis.shouldTrade = true;
        analysis.reason = `Passed all checks (score: ${analysis.score})`;
      }

      logger.info(`Token analysis for ${token.symbol}: ${analysis.reason}`);
      return analysis;
    } catch (error) {
      logger.error(`Error analyzing token: ${error.message}`);
      return {
        shouldTrade: false,
        reason: 'Analysis error',
        score: 0,
      };
    }
  }

  async monitorPositions() {
    try {
      for (const [tradeId, position] of this.activeTrades) {
        if (position.status !== 'open') continue;

        const currentPrice = await this.getCurrentPrice(position.tokenAddress);
        if (!currentPrice) continue;

        const profitPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
        logger.info(
          `📊 ${position.tokenSymbol}: Entry $${position.entryPrice.toFixed(
            8
          )}, Current $${currentPrice.toFixed(8)}, P/L: ${profitPercent.toFixed(2)}%`
        );

        // Check take profit
        if (currentPrice >= position.takeProfit) {
          logger.info(`🎯 TAKE PROFIT HIT for ${position.tokenSymbol}!`);
          await this.closePosition(position, currentPrice, 'take_profit');
        }
        // Check stop loss
        else if (currentPrice <= position.stopLoss) {
          logger.info(`🛑 STOP LOSS HIT for ${position.tokenSymbol}!`);
          await this.closePosition(position, currentPrice, 'stop_loss');
        }
      }
    } catch (error) {
      logger.error(`Error monitoring positions: ${error.message}`);
    }
  }

  async getCurrentPrice(tokenAddress) {
    try {
      const response = await axios.get(
        `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
        { timeout: 5000 }
      );

      if (response.data?.pairs?.length > 0) {
        // Select pair with highest liquidity
        const bestPair = response.data.pairs.reduce((best, current) => {
          return (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? current : best;
        });
        return parseFloat(bestPair.priceUsd);
      }
      return null;
    } catch (error) {
      logger.debug(`Error getting price for ${tokenAddress}: ${error.message}`);
      return null;
    }
  }

  async closePosition(position, currentPrice, reason) {
    try {
      logger.info(`Closing position for ${position.tokenSymbol} - Reason: ${reason}`);

      // Sell tokens back to SOL
      const sellResult = await tradingService.executeTrade(
        position.userId,
        position.tokenAddress,
        position.tokenAmount,
        'sell',
        {
          chain: 'solana',
          slippage: 15,
        }
      );

      if (sellResult.success) {
        const solReceived = sellResult.amount;
        const profit = solReceived - position.amount;
        const profitPercent = (profit / position.amount) * 100;

        logger.info(`✅ Position closed! Received: ${solReceived} SOL`);
        logger.info(`💰 Profit: ${profit.toFixed(6)} SOL (${profitPercent.toFixed(2)}%)`);

        // Update trade
        await Trade.findByIdAndUpdate(position._id, {
          status: 'closed',
          closePrice: currentPrice,
          closeTransactionId: sellResult.transaction.signature,
          closeTimestamp: new Date(),
          profit,
          profitPercent,
          closeReason: reason,
          solReceived,
        });

        // Remove from active trades
        this.activeTrades.delete(position._id.toString());

        // Update performance
        const botInstance = this.activeInstances.get(position.userId);
        if (botInstance) {
          botInstance.performance.totalProfit += profit;
          if (profit > 0) {
            botInstance.performance.successfulTrades += 1;
          }
          this.activeInstances.set(position.userId, botInstance);
        }
      } else {
        logger.error(`Failed to sell ${position.tokenSymbol}: ${sellResult.error}`);
      }
    } catch (error) {
      logger.error(`Error closing position: ${error.message}`);
    }
  }

  async saveTrade(tradeData) {
    try {
      const trade = new Trade(tradeData);
      await trade.save();
      logger.info(`Trade saved to database: ${trade._id}`);
      return trade;
    } catch (error) {
      logger.error(`Error saving trade: ${error.message}`);
      return {
        _id: `temp-${Date.now()}`,
        ...tradeData,
        toObject: () => tradeData,
      };
    }
  }

  async getTrades(userId, limit = 50) {
    try {
      const trades = await Trade.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit);
      return trades;
    } catch (error) {
      logger.error(`Error fetching trades: ${error.message}`);
      const botInstance = this.activeInstances.get(userId);
      return botInstance ? botInstance.trades : [];
    }
  }

  async getBotPerformance(userId) {
    try {
      const botInstance = this.activeInstances.get(userId);
      let trades = [];

      try {
        trades = await this.getTrades(userId, 50);
      } catch (error) {
        logger.error(`Error getting trades from DB: ${error.message}`);
        trades = botInstance ? botInstance.trades : [];
      }

      const performance = botInstance
        ? botInstance.performance
        : {
            totalTrades: trades.length,
            successfulTrades: trades.filter((t) => t.profit > 0).length,
            totalProfit: trades.reduce((sum, t) => sum + (t.profit || 0), 0),
            averageROI: 0,
          };

      const recentTrades = trades.map((trade) => ({
        id: trade._id || trade.id,
        token: trade.tokenAddress || trade.token,
        symbol: trade.tokenSymbol || trade.symbol,
        name: trade.tokenName || trade.name,
        action: trade.action,
        amount: trade.amount,
        price: trade.price,
        timestamp: trade.timestamp,
        signature: trade.transactionId || trade.signature,
        status: trade.status,
        profit: trade.profit,
        profitPercent: trade.profitPercent,
        dexScreenerUrl: trade.dexScreenerUrl,
      }));

      return {
        performance,
        recentTrades,
      };
    } catch (error) {
      logger.error(`Error getting bot performance: ${error.message}`);
      return {
        performance: {
          totalTrades: 0,
          successfulTrades: 0,
          totalProfit: 0,
          averageROI: 0,
        },
        recentTrades: [],
      };
    }
  }

  async updateBotSettings(userId, newSettings) {
    try {
      logger.info(`Received bot settings update request for user ${userId}`);
      logger.info(`Settings update request: ${JSON.stringify(newSettings)}`);

      const maxTradeAmount =
        newSettings.maxTradeAmount !== undefined
          ? parseFloat(newSettings.maxTradeAmount)
          : newSettings.maxTrade !== undefined
          ? parseFloat(newSettings.maxTrade)
          : 0.01;

      if (isNaN(maxTradeAmount) || maxTradeAmount <= 0) {
        logger.error(`Invalid max trade amount: ${maxTradeAmount}`);
        return {
          status: 'error',
          message: 'Invalid max trade amount',
        };
      }

      const botInstance = this.activeInstances.get(userId);

      if (!botInstance) {
        logger.info(`Saved settings for inactive bot for user ${userId}`);
        return {
          status: 'success',
          message: 'Settings saved and will be applied when bot starts',
          settings: {
            ...newSettings,
            maxTradeAmount,
          },
        };
      }

      const normalizedSettings = {
        maxTradeAmount,
        slippage: parseInt(newSettings.slippage) || botInstance.settings.slippage,
        takeProfit: parseInt(newSettings.takeProfit) || botInstance.settings.takeProfit,
        stopLoss: parseInt(newSettings.stopLoss) || botInstance.settings.stopLoss,
        scamDetection:
          newSettings.scamDetection !== undefined
            ? newSettings.scamDetection
            : botInstance.settings.scamDetection,
        gasMultiplier:
          parseFloat(newSettings.gasMultiplier) || botInstance.settings.gasMultiplier,
        walletAddress: botInstance.settings.walletAddress,
        walletBalance: botInstance.settings.walletBalance,
      };

      botInstance.settings = normalizedSettings;
      this.activeInstances.set(userId, botInstance);

      logger.info(`Bot settings updated for user ${userId}: ${JSON.stringify(normalizedSettings)}`);

      return {
        status: 'success',
        message: 'Settings updated successfully',
        settings: normalizedSettings,
      };
    } catch (error) {
      logger.error(`Error updating bot settings for user ${userId}: ${error.message}`);
      return {
        status: 'error',
        message: `Failed to update bot settings: ${error.message}`,
      };
    }
  }

  async stopBot(userId) {
    try {
      logger.info(`Attempting to stop bot for user ${userId}`);

      if (!this.activeInstances.has(userId)) {
        logger.warn(`No active bot found for user ${userId}`);
        return {
          status: 'error',
          message: 'No active bot found for this user',
        };
      }

      const botInstance = this.activeInstances.get(userId);

      // Stop QuickNode monitoring (if no other bots are running)
      if (this.activeInstances.size === 1) {
        quickNodeScanner.stopMonitoring();
      }

      this.activeInstances.delete(userId);

      logger.info(`Bot stopped for user ${userId}`);

      return {
        status: 'success',
        message: 'Bot stopped successfully',
        botStatus: 'inactive',
        performance: botInstance.performance,
      };
    } catch (error) {
      logger.error(`Error stopping bot for user ${userId}: ${error.message}`);
      return {
        status: 'error',
        message: `Failed to stop bot: ${error.message}`,
      };
    }
  }

  getBotStatus(userId) {
    try {
      const botInstance = this.activeInstances.get(userId);

      if (!botInstance) {
        return {
          status: 'inactive',
          settings: {
            maxTradeAmount: this.config.defaultMaxTradeAmount,
            slippage: this.config.defaultSlippage,
            takeProfit: this.config.defaultTakeProfit,
            stopLoss: this.config.defaultStopLoss,
            scamDetection: this.config.defaultScamDetection,
            gasMultiplier: this.config.defaultGasMultiplier,
          },
        };
      }

      return {
        status: botInstance.status,
        settings: botInstance.settings,
        startTime: botInstance.startTime,
        lastScan: botInstance.lastScan,
        performance: botInstance.performance,
        activeTradesCount: Array.from(this.activeTrades.values()).filter(
          (trade) => trade.userId === userId
        ).length,
        watchlistCount: 0,
      };
    } catch (error) {
      logger.error(`Error getting bot status for user ${userId}: ${error.message}`);
      return {
        status: 'error',
        message: `Failed to get bot status: ${error.message}`,
      };
    }
  }

  getActiveTrades(userId) {
    try {
      const activeTrades = Array.from(this.activeTrades.values()).filter(
        (trade) => trade.userId === userId
      );

      return {
        status: 'success',
        trades: activeTrades,
      };
    } catch (error) {
      logger.error(`Error getting active trades for user ${userId}: ${error.message}`);
      return {
        status: 'error',
        message: `Failed to get active trades: ${error.message}`,
      };
    }
  }

  async triggerManualTrade(userId, tokenAddress, amount, type, walletAddress) {
    try {
      const botInstance = this.activeInstances.get(userId);
      if (!botInstance) {
        logger.error(`No active bot for user ${userId}`);
        return {
          success: false,
          error: 'No active bot instance found',
        };
      }

      if (!walletAddress) {
        walletAddress = botInstance.settings.walletAddress;
      }

      const walletConnection = await walletService.connectWallet(walletAddress);
      if (!walletConnection.success) {
        return {
          success: false,
          error: `Failed to connect to wallet: ${walletConnection.error}`,
        };
      }

      try {
        new PublicKey(tokenAddress);
      } catch (error) {
        return {
          success: false,
          error: 'Invalid token address',
        };
      }

      if (type.toLowerCase() === 'buy') {
        const balance = walletConnection.wallet.balance;
        if (balance < parseFloat(amount) + 0.01) {
          return {
            success: false,
            error: `Insufficient wallet balance (${balance} SOL) for trade amount ${amount} SOL plus gas`,
          };
        }
      }

      logger.info(
        `🔔 MANUAL TRADE TRIGGERED: ${type.toUpperCase()} ${amount} SOL of ${tokenAddress}`
      );

      const tradeResult = await tradingService.executeTrade(
        userId,
        tokenAddress,
        parseFloat(amount),
        type.toLowerCase(),
        {
          chain: 'solana',
          slippage: botInstance.settings.slippage,
          gasMultiplier: botInstance.settings.gasMultiplier,
        }
      );

      if (tradeResult.success) {
        // Save to database
        const trade = await this.saveTrade({
          userId,
          tokenAddress,
          tokenSymbol: 'MANUAL',
          tokenName: 'Manual Trade',
          action: type.toLowerCase(),
          amount: tradeResult.amount,
          price: tradeResult.price,
          transactionId: tradeResult.transaction.signature,
          timestamp: new Date(tradeResult.timestamp),
          status: type.toLowerCase() === 'buy' ? 'open' : 'closed',
          dexScreenerUrl: `https://dexscreener.com/solana/${tokenAddress}`,
        });

        // Update bot instance
        botInstance.trades.push({
          id: trade._id.toString(),
          token: tokenAddress,
          symbol: 'MANUAL',
          name: 'Manual Trade',
          action: type.toLowerCase(),
          amount: tradeResult.amount,
          price: tradeResult.price,
          timestamp: new Date(tradeResult.timestamp),
          signature: tradeResult.transaction.signature,
          stopLoss:
            type.toLowerCase() === 'buy'
              ? tradeResult.price * (1 - botInstance.settings.stopLoss / 100)
              : undefined,
          takeProfit:
            type.toLowerCase() === 'buy'
              ? tradeResult.price * (1 + botInstance.settings.takeProfit / 100)
              : undefined,
          status: type.toLowerCase() === 'buy' ? 'open' : 'closed',
          dexScreenerUrl: `https://dexscreener.com/solana/${tokenAddress}`,
        });

        botInstance.performance.totalTrades += 1;
        botInstance.performance.successfulTrades += 1;
        this.activeInstances.set(userId, botInstance);

        // Track active trade for buy orders
        if (type.toLowerCase() === 'buy') {
          this.activeTrades.set(trade._id.toString(), {
            ...trade.toObject(),
            userId,
            tokenInfo: { address: tokenAddress, symbol: 'MANUAL', name: 'Manual Trade' },
            tokenAmount: tradeResult.amount / tradeResult.price,
          });
        }

        return {
          success: true,
          message: `Manual ${type} trade executed successfully`,
          trade: botInstance.trades[botInstance.trades.length - 1],
        };
      } else {
        return {
          success: false,
          error: tradeResult.error || 'Trade execution failed',
        };
      }
    } catch (error) {
      logger.error(`Error triggering manual trade: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  configureCopyTrading(userId, enabled, whaleWallets = []) {
    try {
      logger.info(`Copy trading ${enabled ? 'enabled' : 'disabled'} for user ${userId}`);

      // Placeholder for copy trading logic
      // In a real implementation, this would set up monitoring of whaleWallets
      return {
        status: 'success',
        message: `Copy trading ${enabled ? 'enabled' : 'disabled'} successfully`,
      };
    } catch (error) {
      logger.error(`Error configuring copy trading for user ${userId}: ${error.message}`);
      return {
        status: 'error',
        message: `Failed to configure copy trading: ${error.message}`,
      };
    }
  }

  getTradingSignals(userId) {
    try {
      const botInstance = this.activeInstances.get(userId);

      if (!botInstance) {
        return {
          status: 'error',
          message: 'No active bot found for this user',
        };
      }

      // Placeholder for trading signals
      // In a real implementation, this could return signals from QuickNode or DexScreener
      return {
        status: 'success',
        signals: [],
      };
    } catch (error) {
      logger.error(`Error getting trading signals for user ${userId}: ${error.message}`);
      return {
        status: 'error',
        message: `Failed to get trading signals: ${error.message}`,
      };
    }
  }

  getActiveInstances() {
    return this.activeInstances;
  }
}

const botController = new BotController();
export default botController;