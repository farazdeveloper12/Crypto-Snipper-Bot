// src/utils/config.js
import dotenv from 'dotenv';
import logger from './logger.js';

// Load environment variables from .env file
dotenv.config();

// Configuration with defaults
export const config = {
  // Server configuration
  PORT: process.env.PORT || 5002,
  NODE_ENV: process.env.NODE_ENV || 'development',
  USE_MOCK_DATA: process.env.USE_MOCK_DATA === 'true' || false,
  
  // MongoDB configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto_sniper_bot',
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '7d',
  
  // Blockchain provider URLs
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your_infura_key',
  BSC_RPC_URL: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/',
  
  // API keys
  BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY || '',
  DEX_SCREENER_API_KEY: process.env.DEX_SCREENER_API_KEY || '',
  
  // Wallet configuration
  WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY || '',
  TRADING_WALLET_ADDRESS: process.env.TRADING_WALLET_ADDRESS || '',
  
  // Risk management
  MAX_RISK_PER_TRADE: parseFloat(process.env.MAX_RISK_PER_TRADE) || 0.02,
  STOP_LOSS_THRESHOLD: parseFloat(process.env.STOP_LOSS_THRESHOLD) || 0.05,
  TAKE_PROFIT_THRESHOLD: parseFloat(process.env.TAKE_PROFIT_THRESHOLD) || 0.10,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || './logs/bot.log',
  
  // Social integration
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  
  // Additional API URLs
  JUPITER_API_URL: process.env.JUPITER_API_URL || 'https://jupiter-price-api.publicnode.com',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
};

// Validate critical configuration
function validateConfig() {
  const criticalConfigs = [
    { key: 'MONGODB_URI', value: config.MONGODB_URI },
    { key: 'SOLANA_RPC_URL', value: config.SOLANA_RPC_URL },
    { key: 'BIRDEYE_API_KEY', value: config.BIRDEYE_API_KEY },
    { key: 'WALLET_PRIVATE_KEY', value: config.WALLET_PRIVATE_KEY }
  ];
  
  let valid = true;
  
  for (const { key, value } of criticalConfigs) {
    if (!value) {
      logger.error(`Missing critical configuration: ${key}`);
      valid = false;
    }
  }
  
  // Warn about missing optional configurations
  const optionalConfigs = [
    { key: 'DEX_SCREENER_API_KEY', value: config.DEX_SCREENER_API_KEY }
  ];
  
  for (const { key, value } of optionalConfigs) {
    if (!value) {
      logger.warn(`Missing optional configuration: ${key}`);
    }
  }
  
  return valid;
}

// Call validation on import
const configValid = validateConfig();
if (!configValid) {
  throw new Error('Critical configurations are missing. The bot cannot start.');
}

export default config;