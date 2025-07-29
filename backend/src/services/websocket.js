// backend/src/services/websocket-service.js
const TradingService = require('./trading-service');
const Logger = require('../utils/logger');

class WebSocketService {
  constructor() {
    this.tradingService = new TradingService();
    this.logger = new Logger('websocket-service');
  }

  setupWebSocketServices(io) {
    // Real-time trading room
    const tradingNamespace = io.of('/trading');

    tradingNamespace.on('connection', (socket) => {
      this.logger.info('New client connected to trading namespace');

      // Token monitoring
      socket.on('monitor-token', async (tokenAddress) => {
        try {
          // Real-time token tracking
          const tokenDetails = await this.tradingService.monitorToken(tokenAddress);
          socket.emit('token-update', tokenDetails);
        } catch (error) {
          this.logger.error('Token monitoring error', error);
          socket.emit('error', { message: 'Failed to monitor token' });
        }
      });

      // Trading signals
      socket.on('trade-signal', async (tradeSignal) => {
        try {
          const tradeResult = await this.tradingService.executeSnipe(
            tradeSignal.tokenAddress, 
            tradeSignal.amount, 
            tradeSignal.strategy
          );
          
          socket.emit('trade-result', {
            success: tradeResult,
            timestamp: new Date()
          });
        } catch (error) {
          this.logger.error('Trade execution error', error);
          socket.emit('trade-error', { message: 'Trade execution failed' });
        }
      });

      // Disconnect handling
      socket.on('disconnect', () => {
        this.logger.info('Client disconnected from trading namespace');
      });
    });

    // Market data namespace
    const marketDataNamespace = io.of('/market-data');

    marketDataNamespace.on('connection', (socket) => {
      this.logger.info('New client connected to market data namespace');

      // Real-time market data streaming
      const marketDataInterval = setInterval(async () => {
        try {
          const marketData = await this.tradingService.fetchLatestMarketData();
          socket.emit('market-update', marketData);
        } catch (error) {
          this.logger.error('Market data fetch error', error);
        }
      }, 30000); // Update every 30 seconds

      socket.on('disconnect', () => {
        clearInterval(marketDataInterval);
        this.logger.info('Client disconnected from market data namespace');
      });
    });
  }
}

module.exports = new WebSocketService();