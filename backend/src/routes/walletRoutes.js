// src/routes/walletRoutes.js
import express from 'express';
import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';
import authMiddleware from '../middlewares/auth.js';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

const router = express.Router();

// In-memory wallet storage (should be replaced with database in production)
const wallets = new Map();

/**
 * @route   POST /api/wallet/register
 * @desc    Register a wallet address
 * @access  Private
 */

router.post('/connect', authMiddleware, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        status: 'error',
        message: 'Wallet address is required'
      });
    }

    try {
      new PublicKey(walletAddress);
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Solana wallet address'
      });
    }

    res.json({
      status: 'success',
      message: 'Wallet connected',
      data: {
        walletAddress,
        balance: 0.00
      }
    });
  } catch (error) {
    logger.error(`Connect error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Wallet connection failed'
    });
  }
});

router.post('/register', authMiddleware, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const userId = req.user.id;

    if (!walletAddress) {
      return res.status(400).json({
        status: 'error',
        message: 'Wallet address is required'
      });
    }

    // Validate Solana wallet address
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Solana wallet address'
      });
    }

    // Save wallet (in memory for now)
    wallets.set(userId, {
      address: walletAddress,
      registeredAt: new Date()
    });

    res.status(201).json({
      status: 'success',
      message: 'Wallet registered successfully',
      data: {
        walletAddress
      }
    });
  } catch (error) {
    logger.error(`Register wallet error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Server error during wallet registration'
    });
  }
});

/**
 * @route   GET /api/wallet/balance/:address
 * @desc    Get wallet balance
 * @access  Public
 */
// In src/routes/walletRoutes.js

// backend/src/routes/walletRoutes.js - Focus on the balance endpoint

router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Enhanced logging
    console.log(`[WALLET] Balance request received for: ${address}`);
    
    // Set headers to prevent caching
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    // Validate address
    let publicKey;
    try {
      publicKey = new PublicKey(address);
    } catch (error) {
      console.error(`[WALLET] Invalid address format: ${address}`, error);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Solana wallet address format'
      });
    }

    // Connect to Solana
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    console.log(`[WALLET] Using RPC URL: ${rpcUrl}`);
    
    const connection = new Connection(rpcUrl, 'confirmed');

    // Get SOL balance with detailed error handling
    let balance;
    try {
      balance = await connection.getBalance(publicKey);
      console.log(`[WALLET] Raw balance returned: ${balance} lamports`);
    } catch (balanceError) {
      console.error(`[WALLET] RPC error fetching balance:`, balanceError);
      return res.status(500).json({
        status: 'error',
        message: 'Error communicating with Solana network',
        details: balanceError.message
      });
    }
    
    // Convert from lamports to SOL
    const solBalance = balance / 1_000_000_000;
    console.log(`[WALLET] Final SOL balance: ${solBalance}`);

    // Return successful response
    return res.json({
      status: 'success',
      data: {
        address,
        balanceLamports: balance,
        balanceSol: solBalance,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`[WALLET] Unexpected error in balance endpoint:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching wallet balance',
      details: error.message
    });
  }
});
/**
 * @route   GET /api/wallet/tokens/:address
 * @desc    Get wallet tokens
 * @access  Public
 */
router.get('/tokens/:address', async (req, res) => {
  try {
    const { address } = req.params;

    // Normally this would query token accounts, but we'll return sample data for now
    const sampleTokens = [
      {
        mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
        symbol: 'RAY',
        name: 'Raydium',
        amount: 10.5,
        decimals: 6,
        usdValue: 42.35
      },
      {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        name: 'USD Coin',
        amount: 100,
        decimals: 6,
        usdValue: 100
      }
    ];

    res.json({
      status: 'success',
      data: {
        address,
        tokens: sampleTokens
      }
    });
  } catch (error) {
    logger.error(`Get tokens error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching wallet tokens'
    });
  }
});

/**
 * @route   GET /api/wallet/
 * @desc    Get user's registered wallet
 * @access  Private
 */
router.get('/', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = wallets.get(userId);

    if (!wallet) {
      return res.status(404).json({
        status: 'error',
        message: 'No wallet registered for this user'
      });
    }

    res.json({
      status: 'success',
      data: {
        walletAddress: wallet.address,
        registeredAt: wallet.registeredAt
      }
    });
  } catch (error) {
    logger.error(`Get wallet error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching wallet'
    });
  }
});

export default router;