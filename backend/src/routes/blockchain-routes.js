// backend/src/routes/blockchain-routes.js
const express = require('express');
const router = express.Router();
const BlockchainController = require('../controllers/blockchain-controller');
const authMiddleware = require('../middleware/auth-middleware');

class BlockchainRoutes {
  constructor() {
    this.blockchainController = new BlockchainController();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // Public routes
    router.get('/networks', this.blockchainController.getSupportedNetworks);
    router.get('/token-price/:address', this.blockchainController.getTokenPrice);
    
    // Protected routes (require authentication)
    router.use(authMiddleware.authenticate);
    
    router.get('/wallet-balance', this.blockchainController.getWalletBalance);
    router.post('/token-info', this.blockchainController.getTokenInfo);
    router.get('/transaction-history', this.blockchainController.getTransactionHistory);
    
    // Advanced blockchain interactions
    router.post('/estimate-gas', this.blockchainController.estimateGasFee);
    router.post('/simulate-transaction', this.blockchainController.simulateTransaction);
  }

  getRouter() {
    return router;
  }
}

module.exports = new BlockchainRoutes().getRouter();