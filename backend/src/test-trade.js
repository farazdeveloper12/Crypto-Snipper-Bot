// backend/src/test-trade.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory FIRST before any other imports
dotenv.config({ path: path.join(__dirname, '../.env') });

// Verify env is loaded
console.log('Environment loaded. Checking WALLET_PRIVATE_KEY...');
if (!process.env.WALLET_PRIVATE_KEY) {
  console.error('❌ WALLET_PRIVATE_KEY not found in environment!');
  console.error('Current working directory:', process.cwd());
  console.error('Looking for .env at:', path.join(__dirname, '../.env'));
  process.exit(1);
} else {
  console.log('✅ WALLET_PRIVATE_KEY found in environment');
}

// Now import the services after env is loaded
const { default: tradingService } = await import('./services/tradingService.js');
const { default: logger } = await import('./utils/logger.js');

async function testTrade() {
  try {
    logger.info('=== Starting Trade Test ===');
    
    // Initialize trading service
    await tradingService.initializeConnections();
    
    // Test with USDC (known liquid token)
    const tokenAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
    const amount = 0.01; // 0.01 SOL
    
    logger.info(`Testing trade: Buy ${amount} SOL worth of USDC`);
    logger.info(`Token address: ${tokenAddress}`);
    
    const result = await tradingService.executeTrade(
      'test-user',
      tokenAddress,
      amount,
      'buy',
      {
        chain: 'solana',
        slippage: 10 // 10% slippage for testing
      }
    );
    
    if (result.success) {
      logger.info('✅ TRADE SUCCESSFUL!');
      logger.info(`Transaction ID: ${result.transaction.signature}`);
      logger.info(`Amount: ${result.amount} SOL`);
      logger.info(`Price: ${result.price}`);
      logger.info(`View on Solscan: https://solscan.io/tx/${result.transaction.signature}`);
    } else {
      logger.error('❌ Trade failed');
    }
    
  } catch (error) {
    logger.error(`Test failed: ${error.message}`);
    logger.error(error.stack);
  }
  
  process.exit(0);
}

// Run the test
testTrade();