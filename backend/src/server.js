// backend/src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Connection, PublicKey } from '@solana/web3.js';
import dns from 'dns';
import axios from 'axios';
import mongoose from 'mongoose'; // Add this import

// Import routes
import botRoutes from './routes/botRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import tokenRoutes from './routes/tokenRoutes.js';

// Import services and utilities
import { connectDatabase } from './config/database.js';
import dexService from './services/dexService.js';
import tradingService from './services/tradingService.js';
import logger from './utils/logger.js';
import walletService from './services/walletService.js';
import apiService from './services/apiService.js';
import botController from './controllers/botController.js';

// Replace the default axios with our improved instance
axios.defaults.timeout = 30000;
axios.defaults.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

// Force Node.js to use Google DNS for all hostname lookups
dns.setServers(['8.8.8.8', '8.8.4.4']);
logger.info('Using DNS servers:', dns.getServers());

// Load environment variables
dotenv.config();

const app = express();

// Initialize global objects
global.botStatus = new Map();

// Middleware configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control']
}));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.options('*', cors());

// Direct wallet balance endpoint
app.get('/api/direct-wallet-balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    logger.info(`Direct balance request for: ${address}`);

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');

    let publicKey;
    try {
      publicKey = new PublicKey(address);
    } catch (error) {
      logger.error(`Invalid wallet address: ${address}`);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Solana wallet address'
      });
    }

    const balance = await walletService.getWalletBalance(address);

    return res.json({
      status: 'success',
      data: {
        address,
        balanceLamports: balance.balanceLamports,
        balanceSol: balance.balanceSol,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`Unexpected error in direct balance endpoint: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Server error fetching wallet balance',
      details: error.message
    });
  }
});

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  logger.info(`${req.method} ${req.url} - Started`);

  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} - Completed ${res.statusCode} in ${duration}ms`);
    originalEnd.call(this, chunk, encoding);
  };

  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// DexScreener tokens route (not used as per requirement, but keeping for future use)
app.get('/api/new-launches', async (req, res) => {
  try {
    const chain = req.query.chain || 'bsc';
    const limit = parseInt(req.query.limit || '50');
    const tokens = await dexService.fetchAllTokensOnChain(chain, limit);
    res.json({ status: 'success', data: tokens });
  } catch (error) {
    logger.error(`Failed to fetch tokens: ${error.message}`);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Register routes
app.use('/api/bot', botRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/tokens', tokenRoutes);

// Debugging endpoint to verify server is working
app.get('/api/debug', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is responding correctly',
    timestamp: new Date().toISOString()
  });
});

// Simplified health check endpoint (removed unnecessary API diagnostics)
app.get('/api/debug/connection', async (req, res) => {
  try {
    res.json({
      timestamp: new Date().toISOString(),
      status: 'healthy',
      message: 'Server is running with QuickNode API'
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message
    });
  }
});

// Add a simpler health check endpoint for quick status checks
app.get('/api/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ status: 'error', message: `Route ${req.url} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({ status: 'error', message: err.message });
});

const globalAxios = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  validateStatus: false
});

// Start the server
const startServer = async () => {
  try {
    // Connect to the database
    await connectDatabase();
    logger.info('Connected to MongoDB successfully');

    // Initialize services
    await walletService.initialize();
    await dexService.initialize();
    await tradingService.initializeConnections();
    await apiService.initialize();
    await botController.initialize();

    const PORT = process.env.PORT || 5002;
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Server is accessible at http://localhost:${PORT}`);
      logger.info(`CORS is configured to allow all origins`);
    });

    // Handle MongoDB disconnection and reconnection
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected, attempting to reconnect...');
      setTimeout(async () => {
        try {
          await connectDatabase();
          logger.info('MongoDB reconnected successfully');
        } catch (error) {
          logger.error(`MongoDB reconnection failed: ${error.message}`);
        }
      }, 5000);
    });

    // Enable auto-scanning for new token launches with enhanced error handling
    const scanInterval = setInterval(async () => {
      try {
        const activeUsers = Array.from(global.botStatus.entries())
          .filter(([_, botInfo]) => botInfo.status === 'active')
          .map(([userId]) => userId);

        logger.info(`Scanning for trading opportunities for ${activeUsers.length} active users`);

        let connectivityErrors = 0;

        for (const userId of activeUsers) {
          try {
            // Use QuickNode API instead of botController.scanForTradingOpportunities
            const tokens = await apiService.fetchNewlyLaunchedTokens();
            if (tokens.length > 0) {
              logger.info(`Found ${tokens.length} newly launched tokens for user ${userId}`);
              // Tokens are already being analyzed in botService.js, no need to call botController.scanForTradingOpportunities
            }
          } catch (userError) {
            logger.error(`Error scanning for user ${userId}: ${userError.message}`);

            if (userError.message.includes('ENOTFOUND') || 
                userError.message.includes('timeout') || 
                userError.message.includes('failed to fetch')) {
              connectivityErrors++;
            }
          }
        }

        if (connectivityErrors > 0) {
          logger.warn(`Detected ${connectivityErrors} connectivity errors during scan`);
          // Removed apiService.refreshConnections() as it's not needed with QuickNode API only
        }
      } catch (error) {
        logger.error(`Auto scan error: ${error.message}`);

        if (error.message.includes('ENOTFOUND') || 
            error.message.includes('timeout') || 
            error.message.includes('network')) {
          logger.info('Attempting to recover from network error');
          try {
            dns.setServers(['8.8.8.8', '8.8.4.4']);
            logger.info('Recovery attempt completed');
          } catch (recoveryError) {
            logger.error(`Recovery attempt failed: ${recoveryError.message}`);
          }
        }
      }
    }, 30000);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Shutting down server...');
      clearInterval(scanInterval);
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    return server;
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    if (err.name === 'MongoServerSelectionError') {
      logger.error('MongoDB connection failed. Make sure your IP is whitelisted in MongoDB Atlas.');
    }
    return null;
  }
};

// Start the server and handle initial connection failures
startServer().catch(err => {
  logger.error(`Server startup error: ${err.message}`);

  let retryCount = 0;
  const maxRetries = 3;

  const retryConnection = setInterval(async () => {
    retryCount++;
    logger.info(`Retrying database connection (${retryCount}/${maxRetries})...`);

    try {
      await connectDatabase();
      logger.info('Database connection successful on retry');
      clearInterval(retryConnection);
      startServer();
    } catch (error) {
      logger.error(`Retry ${retryCount} failed: ${error.message}`);

      if (retryCount >= maxRetries) {
        logger.error(`Maximum retries (${maxRetries}) reached. Giving up.`);
        clearInterval(retryConnection);
        process.exit(1);
      }
    }
  }, 5000);
});

export default app;