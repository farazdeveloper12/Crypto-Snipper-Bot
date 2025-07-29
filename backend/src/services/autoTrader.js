// src/services/autoTrader.js
import logger from '../utils/logger.js';
import dataFetcher from './data-fetcher.js';
import tokenAnalyzer from './tokenAnalyzer.js';
import walletService from './walletService.js';
import dexService from './dexService.js';
import Trade from '../models/trade.js';
import { broadcastTrade } from '../websocket/socketServer.js';

class AutoTrader {
  constructor() {
    this.settings = {
      maxTradeSizeSOL: 0.01,
      minTradeSizeSOL: 0.005,
      slippage: 0.1,
      defaultTakeProfit: 50,
      defaultStopLoss: 10,
      safetyThreshold: 50, // Reduced to match tokenAnalyzer
      buyConfidenceThreshold: 50, // Reduced to match tokenAnalyzer
      gasMultiplier: 1.5,
      autoTradingEnabled: true,
      copyTradingEnabled: false,
      whaleWallets: [],
      walletBalance: 0,
      walletAddress: '5h4sVsNhuxcqtaWP1XUTPUwQdDEbuuXBeN27fGgirap9'
    };

    this.activeTrades = new Map();
    this.watchlist = new Map();
    this.tradingSignals = new Map();

    this.metrics = {
      totalTrades: 0,
      successfulTrades: 0,
      totalProfit: 0,
      averageROI: 0,
      totalTokensScanned: 0,
      tokensAnalyzed: 0,
      opportunitiesFound: 0,
      buySignalsGenerated: 0,
      analysisErrors: 0,
      scanErrors: 0,
      lastScanTime: null
    };
  }

  async initialize() {
    logger.info('Initializing auto trader service');
    await dexService.initialize();
    logger.info('Auto trader service initialized successfully');
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    logger.info(`Auto trader settings updated: ${JSON.stringify(this.settings)}`);
  }

  getPerformanceMetrics() {
    return {
      totalTrades: this.metrics.totalTrades,
      successfulTrades: this.metrics.successfulTrades,
      totalProfit: this.metrics.totalProfit,
      averageROI: this.metrics.averageROI,
      activeTradesCount: this.activeTrades.size,
      watchlistCount: this.watchlist.size,
      buySignalsGenerated: this.metrics.buySignalsGenerated
    };
  }

  async scanForOpportunities(chain = 'solana', options = {}) {
    try {
      if (!this.settings.autoTradingEnabled) {
        logger.info('Auto trading is disabled, skipping opportunity scan');
        return [];
      }

      logger.info(`Scanning for trading opportunities on ${chain}`);

      const newTokens = await dataFetcher.fetchNewlyAddedTokens(chain);
      logger.info(`Found ${newTokens.length} tokens to analyze`);

      if (newTokens.length === 0) {
        logger.warn('No tokens returned from data-fetcher');
        return [];
      }

      this.metrics.totalTokensScanned += newTokens.length;
      this.metrics.lastScanTime = new Date();

      const opportunities = [];
      let tokensAnalyzed = 0;
      let tokensRejected = 0;

      for (const token of newTokens) {
        try {
          if (!token.address) {
            logger.warn("Skipping token with missing address");
            continue;
          }

          if (this.activeTrades.has(token.address)) {
            logger.info(`Skipped ${token.symbol || 'Unknown'}: Already in active trades`);
            continue;
          }

          tokensAnalyzed++;
          logger.info(`Analyzing ${tokensAnalyzed}/${newTokens.length}: ${token.symbol || 'Unknown'} (${token.address})`);
          logger.info(`Token details: Price: $${token.price || 'Unknown'}, Market Cap: $${token.marketCap || 'Unknown'}, Liquidity: $${token.liquidity || 'Unknown'}`);

          const analysis = await tokenAnalyzer.analyzeToken(token.address, chain);

          if (!analysis) {
            logger.warn(`No analysis returned for ${token.address}`);
            tokensRejected++;
            continue;
          }

          this.metrics.tokensAnalyzed++;
          logger.info(`Analysis results for ${token.symbol || 'Unknown'}:`);
          logger.info(`- Safety Score: ${analysis.safetyScore.toFixed(2)}/100`);
          logger.info(`- Is Safe: ${analysis.isSafe ? 'Yes' : 'No'}`);
          logger.info(`- Buy Recommendation: ${analysis.buyRecommendation ? 'Yes' : 'No'}`);

          const safetyThreshold = this.settings.safetyThreshold || 50;
          if (analysis.safetyScore >= safetyThreshold && analysis.buyRecommendation) {
            const buyConfidence = this.calculateBuyConfidence(analysis);
            const opportunity = {
              token: token,
              analysis: analysis,
              timestamp: new Date(),
              confidence: buyConfidence,
              discoveryPrice: token.price,
              discoveryTime: new Date(),
              suggestedEntryPrice: analysis.tradingPotential?.suggestedEntryPrice || token.price || 0.00001,
              suggestedStopLoss: analysis.tradingPotential?.suggestedStopLoss || ((token.price || 0.00001) * (1 - this.settings.defaultStopLoss / 100)),
              suggestedTakeProfit: analysis.tradingPotential?.suggestedTakeProfit || ((token.price || 0.00001) * (1 + this.settings.defaultTakeProfit / 100)),
              expectedROI: analysis.tradingPotential?.expectedROI || { expected24hROI: 100 }
            };

            opportunities.push(opportunity);
            logger.info(`[OPPORTUNITY] Found trading opportunity for ${token.symbol || token.name || token.address}`);
            logger.info(`Safety score: ${analysis.safetyScore.toFixed(2)}, Buy confidence: ${buyConfidence.toFixed(2)}%`);
            logger.info(`Expected ROI: ${opportunity.expectedROI.expected24hROI?.toFixed(2) || 'Unknown'}%`);

            this.addToWatchlist(token.address, analysis, opportunity);

            const buyConfidenceThreshold = this.settings.buyConfidenceThreshold || 50;
            if (this.settings.autoTradingEnabled &&
                analysis.safetyScore >= safetyThreshold &&
                buyConfidence >= buyConfidenceThreshold) {
              logger.info(`🚀 GENERATING BUY SIGNAL for ${token.symbol || token.address} with confidence: ${buyConfidence.toFixed(2)}%`);
              this.generateBuySignal(token.address, analysis, opportunity);
              this.metrics.buySignalsGenerated++;
            } else {
              logger.info(`Token ${token.symbol || token.address} added to watchlist but did not generate buy signal`);
              logger.info(`Required: Safety >= ${safetyThreshold}, Confidence >= ${buyConfidenceThreshold}, Auto-trading: ${this.settings.autoTradingEnabled}`);
            }
          } else {
            logger.info(`Token ${token.symbol || token.address} rejected:`);
            logger.info(`- Safety Score: ${analysis.safetyScore.toFixed(2)} (Threshold: ${safetyThreshold})`);
            logger.info(`- Buy Recommendation: ${analysis.buyRecommendation ? 'Yes' : 'No'}`);
            tokensRejected++;
          }
        } catch (error) {
          logger.error(`Error analyzing token ${token?.address || 'unknown'}: ${error.message}`);
          this.metrics.analysisErrors++;
        }
      }

      logger.info(`=== ANALYSIS SUMMARY ===`);
      logger.info(`Total tokens: ${newTokens.length}`);
      logger.info(`- Analyzed: ${tokensAnalyzed}`);
      logger.info(`- Rejected: ${tokensRejected}`);
      logger.info(`- Opportunities: ${opportunities.length}`);
      logger.info(`Active trades: ${this.activeTrades.size}`);
      logger.info(`Watchlist tokens: ${this.watchlist.size}`);

      if (opportunities.length > 0 && this.settings.autoTradingEnabled) {
        logger.info(`Ready to act on ${opportunities.length} trading opportunities on ${chain}`);
        await this.executeTrades(opportunities, chain);
      } else if (opportunities.length === 0) {
        logger.info(`No trading opportunities found on ${chain}`);
      }

      this.metrics.opportunitiesFound += opportunities.length;
      return opportunities;
    } catch (error) {
      logger.error(`Error scanning for opportunities: ${error.message}`);
      this.metrics.scanErrors++;
      return [];
    }
  }

  calculateBuyConfidence(analysis) {
    if (!analysis || !analysis.riskAssessment || !analysis.riskAssessment.checks) {
      return 0;
    }

    const weights = {
      liquidity: 0.3,
      marketCap: 0.2,
      holders: 0.2,
      volatility: 0.1,
      contract: 0.1,
      honeypot: 0.1
    };

    let confidence = 0;
    for (const [check, result] of Object.entries(analysis.riskAssessment.checks)) {
      if (result.passed) {
        confidence += (result.score || 0) * (weights[check] || 0);
      }
    }

    return Math.min(confidence, 100);
  }

  addToWatchlist(tokenAddress, analysis, opportunity) {
    this.watchlist.set(tokenAddress, {
      analysis,
      opportunity,
      addedAt: new Date()
    });
    logger.info(`Added ${tokenAddress} to watchlist`);
  }

  generateBuySignal(tokenAddress, analysis, opportunity) {
    this.tradingSignals.set(tokenAddress, {
      type: 'buy',
      confidence: this.calculateBuyConfidence(analysis),
      price: opportunity.suggestedEntryPrice,
      timestamp: new Date(),
      stopLoss: opportunity.suggestedStopLoss,
      takeProfit: opportunity.suggestedTakeProfit,
      expectedROI: opportunity.expectedROI
    });
    logger.info(`Generated BUY signal for ${tokenAddress} at $${opportunity.suggestedEntryPrice} with ${this.calculateBuyConfidence(analysis).toFixed(2)}% confidence`);
  }

  async executeTrades(opportunities, chain) {
    try {
      const walletBalance = await walletService.getWalletBalance(this.settings.walletAddress);
      let availableBalance = walletBalance.balanceSol;
      logger.info(`Wallet balance: ${availableBalance} SOL`);

      for (const opportunity of opportunities) {
        try {
          const tokenAddress = opportunity.token.address;
          const entryPrice = opportunity.suggestedEntryPrice;
          const stopLoss = opportunity.suggestedStopLoss;
          const takeProfit = opportunity.suggestedTakeProfit;

          let tradeSizeSOL = this.settings.maxTradeSizeSOL;
          const requiredBalance = tradeSizeSOL * 1.1;
          if (availableBalance < requiredBalance) {
            tradeSizeSOL = Math.min(availableBalance * 0.9, this.settings.maxTradeSizeSOL);
            logger.info(`Adjusted trade size to ${tradeSizeSOL} SOL due to insufficient balance`);
          }

          if (tradeSizeSOL < this.settings.minTradeSizeSOL) {
            logger.warn(`Insufficient balance (${availableBalance} SOL) for trading with min size ${this.settings.minTradeSizeSOL} SOL`);
            continue;
          }

          logger.info(`Executing trade for ${opportunity.token.symbol || tokenAddress} with ${tradeSizeSOL} SOL`);

          const swapResult = await dexService.swapTokens(
            this.settings.walletAddress,
            'SOL',
            tokenAddress,
            tradeSizeSOL,
            entryPrice * tradeSizeSOL,
            this.settings.slippage,
            chain
          );

          if (swapResult.success) {
            this.activeTrades.set(tokenAddress, {
              tokenAddress,
              symbol: opportunity.token.symbol,
              entryPrice,
              amount: tradeSizeSOL,
              stopLoss,
              takeProfit,
              entryTime: new Date(),
              transactionId: swapResult.transactionId,
              walletAddress: this.settings.walletAddress
            });

            // Save trade to MongoDB
            const trade = new Trade({
              tokenAddress,
              symbol: opportunity.token.symbol,
              amount: tradeSizeSOL,
              entryPrice,
              transactionId: swapResult.transactionId,
              walletAddress: this.settings.walletAddress,
              timestamp: new Date()
            });
            await trade.save();

            // Broadcast trade event to frontend
            broadcastTrade(trade);

            this.metrics.totalTrades++;
            availableBalance -= tradeSizeSOL;
            logger.info(`Successfully executed BUY for ${tokenAddress}: ${tradeSizeSOL} SOL at $${entryPrice}`);
            logger.info(`Transaction ID: ${swapResult.transactionId}`);
          } else {
            logger.error(`Failed to execute trade for ${tokenAddress}: ${swapResult.error}`);
          }
        } catch (error) {
          logger.error(`Error executing trade for ${opportunity.token.address}: ${error.message}`);
        }
      }
    } catch (error) {
      logger.error(`Error executing trades: ${error.message}`);
    }
  }

  async monitorActiveTrades(walletAddress) {
    try {
      logger.info(`Monitoring active trades: ${this.activeTrades.size} trades`);
      const triggeredTrades = [];

      for (const [tokenAddress, trade] of this.activeTrades.entries()) {
        if (trade.walletAddress !== walletAddress) {
          continue;
        }

        try {
          const currentPrice = await dexService.getTokenPrice(tokenAddress);
          const profitLoss = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;

          logger.info(`Monitoring ${trade.symbol || tokenAddress}: Current Price: $${currentPrice}, P/L: ${profitLoss.toFixed(2)}%`);

          const currentMarketCap = await this.getMarketCap(tokenAddress);
          const entryMarketCap = trade.entryMarketCap || 0;
          const marketCapMultiplier = currentMarketCap / entryMarketCap;

          if (marketCapMultiplier >= 10 || currentPrice >= trade.takeProfit) {
            const sellResult = await dexService.swapTokens(
              trade.walletAddress,
              tokenAddress,
              'SOL',
              trade.amount,
              currentPrice * trade.amount,
              this.settings.slippage,
              'solana'
            );

            if (sellResult.success) {
              this.metrics.successfulTrades++;
              this.metrics.totalProfit += profitLoss;
              this.metrics.averageROI = (this.metrics.averageROI * (this.metrics.totalTrades - 1) + profitLoss) / this.metrics.totalTrades;
              this.activeTrades.delete(tokenAddress);
              logger.info(`Successfully executed SELL for ${tokenAddress}: ${trade.amount} tokens at $${currentPrice}, Profit: ${profitLoss.toFixed(2)}%`);
              logger.info(`Transaction ID: ${sellResult.transactionId}`);
              triggeredTrades.push({ type: 'sell', tokenAddress, profit: profitLoss });
            }
          } else if (currentPrice <= trade.stopLoss) {
            const sellResult = await dexService.swapTokens(
              trade.walletAddress,
              tokenAddress,
              'SOL',
              trade.amount,
              currentPrice * trade.amount,
              this.settings.slippage,
              'solana'
            );

            if (sellResult.success) {
              this.metrics.totalProfit += profitLoss;
              this.metrics.averageROI = (this.metrics.averageROI * (this.metrics.totalTrades - 1) + profitLoss) / this.metrics.totalTrades;
              this.activeTrades.delete(tokenAddress);
              logger.info(`Stop-loss triggered for ${tokenAddress}: Sold ${trade.amount} tokens at $${currentPrice}, Loss: ${profitLoss.toFixed(2)}%`);
              logger.info(`Transaction ID: ${sellResult.transactionId}`);
              triggeredTrades.push({ type: 'sell', tokenAddress, profit: profitLoss });
            }
          }
        } catch (error) {
          logger.error(`Error monitoring trade for ${tokenAddress}: ${error.message}`);
        }
      }

      return triggeredTrades;
    } catch (error) {
      logger.error(`Error monitoring active trades: ${error.message}`);
      return [];
    }
  }

  async getMarketCap(tokenAddress) {
    return 1000000;
  }

  async executeSignals(walletAddress) {
    try {
      const trades = [];
      for (const [tokenAddress, signal] of this.tradingSignals.entries()) {
        if (signal.executed) continue;

        if (signal.type === 'buy') {
          const swapResult = await dexService.swapTokens(
            walletAddress,
            'SOL',
            tokenAddress,
            this.settings.maxTradeSizeSOL,
            signal.price * this.settings.maxTradeSizeSOL,
            this.settings.slippage,
            'solana'
          );

          if (swapResult.success) {
            this.activeTrades.set(tokenAddress, {
              tokenAddress,
              symbol: signal.symbol || tokenAddress,
              entryPrice: signal.price,
              amount: this.settings.maxTradeSizeSOL,
              stopLoss: signal.stopLoss,
              takeProfit: signal.takeProfit,
              entryTime: new Date(),
              transactionId: swapResult.transactionId,
              walletAddress,
              entryMarketCap: await this.getMarketCap(tokenAddress)
            });

            const trade = new Trade({
              tokenAddress,
              symbol: signal.symbol || tokenAddress,
              amount: this.settings.maxTradeSizeSOL,
              entryPrice: signal.price,
              transactionId: swapResult.transactionId,
              walletAddress,
              timestamp: new Date()
            });
            await trade.save();

            broadcastTrade(trade);

            signal.executed = true;
            trades.push({
              type: 'buy',
              tokenAddress,
              amount: this.settings.maxTradeSizeSOL,
              price: signal.price,
              transactionId: swapResult.transactionId
            });
          }
        }
      }
      return trades;
    } catch (error) {
      logger.error(`Error executing signals: ${error.message}`);
      return [];
    }
  }
}

const autoTrader = new AutoTrader();
export default autoTrader;