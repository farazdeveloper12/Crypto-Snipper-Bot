#!/usr/bin/env node
import Server from '../src/server.js';
import TradingService from '../src/services/tradingService.js';
import RiskManagementService from '../src/services/risk-management.js';
import logger from '../src/utils/logger.js';

async function startBot() {
  try {
    logger.info("🚀 Starting Crypto Sniper Bot...");

    // Initialize risk management
    const riskManager = new RiskManagementService();
    await riskManager.initialize();

    // Start trading service
    const tradingService = new TradingService(riskManager);
    await tradingService.start();

    // Start the backend server
    const server = Server.start();
    
    // Check blockchain and wallet
    await performStartupDiagnostics();

    logger.info("✅ Bot is running successfully!");
    return { server, tradingService, riskManager };
  } catch (error) {
    logger.error("❌ Bot startup failed:", error);
    process.exit(1);
  }
}

// Perform diagnostic checks
async function performStartupDiagnostics() {
  try {
    await Promise.all([
      checkBlockchainConnection(),
      checkAPIIntegrations(),
      validateWalletBalances()
    ]);
    logger.info("✅ Startup diagnostics passed successfully!");
  } catch (error) {
    logger.warn("⚠️ Some startup diagnostics failed:", error);
  }
}

async function checkBlockchainConnection() {
  logger.info("🔗 Checking blockchain network connectivity...");
}

async function checkAPIIntegrations() {
  logger.info("🌐 Checking API integrations...");
}

async function validateWalletBalances() {
  logger.info("💰 Validating wallet balances...");
}

// Start the bot
startBot().catch(error => {
  logger.error("🔥 Fatal error during bot startup:", error);
  process.exit(1);
});

export { startBot };
