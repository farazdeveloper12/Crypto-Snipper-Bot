// src/routes/dex-routes.js
import express from 'express';
import dexService from '../services/dexService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// GET /api/dex/pairs?chain=solana&limit=50
router.get('/pairs', async (req, res) => {
  try {
    const chain = req.query.chain || 'solana';
    const limit = req.query.limit || 50;
    // Fetch all pairs
    const pairs = await dexService.getAllPairs(chain, limit);

    // If you want *all* coins, just return pairs
    // If you only want meme coins:
    // const memeCoins = dexService.filterMemeCoins(pairs);

    res.json({ status: 'success', data: pairs });
  } catch (error) {
    logger.error(`Failed to fetch Dex pairs: ${error.message}`);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
