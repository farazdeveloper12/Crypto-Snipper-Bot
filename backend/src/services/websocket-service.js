// backend/src/services/websocket-service.js
const WebSocket = require('ws');
const Logger = require('../utils/logger');

class WebSocketService {
  constructor() {
    this.logger = new Logger('websocket-service');
    this.clients = new Set();
    this.initializeWebSocketServer();
  }

  initializeWebSocketServer() {
    this.wss = new WebSocket.Server({ 
      port: process.env.WEBSOCKET_PORT || 8080 
    });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      
      ws.on('message', (message) => {
        this.handleIncomingMessage(ws, message);
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });

    this.logger.info('WebSocket server initialized');
  }

  handleIncomingMessage(client, message) {
    try {
      const parsedMessage = JSON.parse(message);
      
      switch(parsedMessage.type) {
        case 'subscribe':
          this.handleSubscription(client, parsedMessage);
          break;
        case 'trading_signal':
          this.broadcastTradingSignal(parsedMessage);
          break;
        default:
          this.logger.warn('Unknown message type', parsedMessage);
      }
    } catch (error) {
      this.logger.error('WebSocket message handling error', error);
    }
  }

  handleSubscription(client, message) {
    // Implement channel/topic subscription logic
    client.send(JSON.stringify({
      type: 'subscription_confirmed',
      channel: message.channel
    }));
  }

  broadcastTradingSignal(signal) {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(signal));
      }
    });
  }

  sendMarketUpdate(update) {
    const message = JSON.stringify({
      type: 'market_update',
      data: update
    });

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

module.exports = new WebSocketService();