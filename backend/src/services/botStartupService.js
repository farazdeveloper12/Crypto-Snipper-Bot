// src/services/botStartupService.js
import WalletService from './walletService.js';
import TradingService from './tradingService.js';
import logger from '../utils/logger.js';

class BotStartupService {
  async initializeBot() {
    try {
      // Validate wallet
      const phantomPrivateKey = process.env.PHANTOM_WALLET_PRIVATE_KEY;
      if (!phantomPrivateKey) {
        throw new Error('Phantom wallet private key not configured');
      }

      // Initialize wallet
      const walletInitResult = await WalletService.initializeWallet(phantomPrivateKey);
      
      // Initialize trading service
      const tradingService = new TradingService(walletInitResult);
      await tradingService.start();

      logger.info('Bot initialized successfully', {
        walletPublicKey: walletInitResult.publicKey,
        balance: walletInitResult.balance
      });

      return {
        status: 'active',
        wallet: walletInitResult,
        tradingActive: true
      };
    } catch (error) {
      logger.error('Bot initialization failed:', error);
      throw error;
    }
  }
}

export default new BotStartupService();