// backend/src/controllers/blockchain-controller.js
const BlockchainService = require('../services/blockchain-service');
const Logger = require('../utils/logger');

class BlockchainController {
  constructor() {
    this.blockchainService = new BlockchainService();
    this.logger = new Logger('blockchain-controller');
  }

  // Get supported blockchain networks
  async getSupportedNetworks(req, res) {
    try {
      const networks = await this.blockchainService.getSupportedNetworks();
      res.json(networks);
    } catch (error) {
      this.logger.error('Failed to fetch supported networks', error);
      res.status(500).json({ error: 'Failed to fetch networks' });
    }
  }

  // Get wallet balance
  async getWalletBalance(req, res) {
    try {
      const { blockchain } = req.query;
      const balance = await this.blockchainService.getWalletBalance(
        req.user.walletAddress, 
        blockchain
      );
      res.json({ balance });
    } catch (error) {
      this.logger.error('Failed to fetch wallet balance', error);
      res.status(500).json({ error: 'Failed to fetch balance' });
    }
  }

  // Get token price
  async getTokenPrice(req, res) {
    try {
      const { address } = req.params;
      const price = await this.blockchainService.getTokenPrice(address);
      res.json({ price });
    } catch (error) {
      this.logger.error('Failed to fetch token price', error);
      res.status(500).json({ error: 'Failed to fetch token price' });
    }
  }

  // Get token information
  async getTokenInfo(req, res) {
    try {
      const { tokenAddress } = req.body;
      const tokenInfo = await this.blockchainService.getTokenInfo(tokenAddress);
      res.json(tokenInfo);
    } catch (error) {
      this.logger.error('Failed to fetch token info', error);
      res.status(500).json({ error: 'Failed to fetch token information' });
    }
  }

  // Get transaction history
  async getTransactionHistory(req, res) {
    try {
      const { blockchain, limit = 50, offset = 0 } = req.query;
      const history = await this.blockchainService.getTransactionHistory(
        req.user.walletAddress, 
        blockchain, 
        limit, 
        offset
      );
      res.json(history);
    } catch (error) {
      this.logger.error('Failed to fetch transaction history', error);
      res.status(500).json({ error: 'Failed to fetch transaction history' });
    }
  }

  // Estimate gas fee
  async estimateGasFee(req, res) {
    try {
      const { blockchain, transaction } = req.body;
      const gasFee = await this.blockchainService.estimateGasFee(
        blockchain, 
        transaction
      );
      res.json({ gasFee });
    } catch (error) {
      this.logger.error('Failed to estimate gas fee', error);
      res.status(500).json({ error: 'Failed to estimate gas fee' });
    }
  }

  // Simulate transaction
  async simulateTransaction(req, res) {
    try {
      const { blockchain, transaction } = req.body;
      const simulationResult = await this.blockchainService.simulateTransaction(
        blockchain, 
        transaction
      );
      res.json(simulationResult);
    } catch (error) {
      this.logger.error('Transaction simulation failed', error);
      res.status(500).json({ error: 'Transaction simulation failed' });
    }
  }
}

module.exports = BlockchainController;