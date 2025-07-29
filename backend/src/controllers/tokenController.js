// src/controllers/tokenController.js
import { logger } from '../utils/logger.js';
import tokenService from '../services/tokenService.js';
import Token from '../models/Token.js';

// Search for a token
export const searchToken = async (req, res) => {
  try {
    const { query, chain } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Search for token
    const token = await tokenService.searchToken(query, chain || 'solana');
    
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }
    
    res.status(200).json({
      token
    });
  } catch (error) {
    logger.error(`Search token error: ${error.message}`);
    res.status(500).json({ message: `Failed to search for token: ${error.message}` });
  }
};

// Get new token launches
export const getNewTokens = async (req, res) => {
  try {
    const { chain, limit } = req.query;
    
    // Get new tokens
    const tokens = await tokenService.getNewTokens(
      chain || 'solana',
      parseInt(limit) || 10
    );
    
    res.status(200).json({
      tokens
    });
  } catch (error) {
    logger.error(`Get new tokens error: ${error.message}`);
    res.status(500).json({ message: `Failed to get new tokens: ${error.message}` });
  }
};

// Get token details
export const getTokenDetails = async (req, res) => {
  try {
    const { address } = req.params;
    const { chain } = req.query;
    
    if (!address) {
      return res.status(400).json({ message: 'Token address is required' });
    }
    
    // Search for token to get latest data
    const token = await tokenService.searchToken(address, chain || 'solana');
    
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }
    
    res.status(200).json({
      token
    });
  } catch (error) {
    logger.error(`Get token details error: ${error.message}`);
    res.status(500).json({ message: `Failed to get token details: ${error.message}` });
  }
};

export default {
  searchToken,
  getNewTokens,
  getTokenDetails
};