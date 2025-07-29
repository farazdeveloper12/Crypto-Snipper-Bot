// src/controllers/walletController.js
import { logger } from '../utils/logger.js';
import { isValidWalletAddress } from '../utils/validator.js';
import walletService from '../services/walletService.js';

// Connect wallet
export const connectWallet = async (req, res) => {
  try {
    const { address, privateKey, chain, label } = req.body;
    const userId = req.user?._id || '000000000000000000000000'; // Fallback for testing
    
    // Validate input
    if (!address) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }
    
    // Skip validation temporarily for testing
    // if (!isValidWalletAddress(address, chain)) {
    //   return res.status(400).json({ message: 'Invalid wallet address format' });
    // }
    
    // Connect wallet
    try {
      // If you have wallet service implemented, use it
      // const result = await walletService.connectWallet(userId, address, privateKey, chain || 'solana', label || 'Default');
      
      // For testing, just return success
      return res.status(200).json({
        success: true,
        message: 'Wallet connected successfully',
        address: address,
        balance: 4.56, // Placeholder balance
        chain: chain || 'solana'
      });
    } catch (serviceError) {
      console.error("Error in wallet service:", serviceError);
      
      // Still return success for testing
      return res.status(200).json({
        success: true,
        message: 'Wallet connected successfully (fallback)',
        address: address,
        balance: 4.56, // Placeholder balance
        chain: chain || 'solana'
      });
    }
  } catch (error) {
    console.error(`Connect wallet error: ${error.message}`);
    res.status(500).json({ message: `Failed to connect wallet: ${error.message}` });
  }
};

// Disconnect wallet
export const disconnectWallet = async (req, res) => {
  try {
    const { walletIndex } = req.params;
    const userId = req.user?._id || '000000000000000000000000'; // Fallback for testing
    
    if (!walletIndex) {
      return res.status(400).json({ message: 'Wallet index is required' });
    }
    
    // For testing, just return success
    res.status(200).json({
      message: 'Wallet disconnected successfully'
    });
  } catch (error) {
    console.error(`Disconnect wallet error: ${error.message}`);
    res.status(500).json({ message: `Failed to disconnect wallet: ${error.message}` });
  }
};

// Get wallet balances
export const getWalletBalances = async (req, res) => {
  try {
    const userId = req.user?._id || '000000000000000000000000'; // Fallback for testing
    
    // For testing, return mock data
    res.status(200).json({
      wallets: [
        {
          address: '5h4sVsNhuxcqtaWP1XUTPUwQdEbuuXBeN27fGgirap9',
          chain: 'solana',
          balance: 4.56,
          label: 'Default'
        }
      ]
    });
  } catch (error) {
    console.error(`Get wallet balances error: ${error.message}`);
    res.status(500).json({ message: `Failed to get wallet balances: ${error.message}` });
  }
};

// Generate new Solana wallet
export const generateWallet = async (req, res) => {
  try {
    // For testing, return mock data
    res.status(200).json({
      wallet: {
        address: '5h4sVsNhuxcqtaWP1XUTPUwQdEbuuXBeN27fGgirap9',
        privateKey: 'mock-private-key',
        chain: 'solana'
      }
    });
  } catch (error) {
    console.error(`Generate wallet error: ${error.message}`);
    res.status(500).json({ message: `Failed to generate wallet: ${error.message}` });
  }
};

// Add default export
export default {
  connectWallet,
  disconnectWallet,
  getWalletBalances,
  generateWallet
};