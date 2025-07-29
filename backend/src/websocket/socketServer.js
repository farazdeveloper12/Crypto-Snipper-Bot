// backend/src/websocket/socketServer.js
import WebSocket, { WebSocketServer } from 'ws';
import logger from '../utils/logger.js';

const wss = new WebSocketServer({ port: 5002 });

wss.on('connection', (ws) => {
  logger.info('New WebSocket connection established');
  
  ws.on('message', (message) => {
    logger.info(`Received message: ${message}`);
  });
  
  ws.on('close', () => {
    logger.info('WebSocket connection closed');
  });
});

// Function to broadcast trade events
const broadcastTrade = (trade) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'trade', data: trade }));
    }
  });
};

export { wss, broadcastTrade };