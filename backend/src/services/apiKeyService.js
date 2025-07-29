// src/services/apiKeyService.js
import dotenv from 'dotenv';

class ApiKeyService {
  constructor() {
    dotenv.config();
    this.keys = {
      infura: process.env.INFURA_PROJECT_ID,
      etherscan: process.env.ETHERSCAN_API_KEY,
      coingecko: process.env.COINGECKO_API_KEY,
      dexScreener: process.env.DEXSCREENER_API_KEY,
      binance: {
        key: process.env.BINANCE_API_KEY,
        secret: process.env.BINANCE_SECRET_KEY
      }
    };
  }

  getKey(service) {
    const key = this.keys[service];
    if (!key) {
      throw new Error(`API key for ${service} not configured`);
    }
    return key;
  }

  // Secure key retrieval with optional masking
  getSecureKey(service, mask = true) {
    const key = this.getKey(service);
    return mask ? this.maskKey(key) : key;
  }

  // Simple key masking
  maskKey(key) {
    if (!key) return null;
    return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4);
  }
}

export default new ApiKeyService();