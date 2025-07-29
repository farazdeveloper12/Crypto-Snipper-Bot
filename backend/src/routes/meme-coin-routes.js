// backend/src/routes/meme-coin-routes.js
import express from 'express';
import dexScreenerService from '../services/dexscreener-service.js';

const router = express.Router();

// GET /api/meme-coins
router.get('/', async (req, res) => {
  try {
    const memeCoins = await dexScreenerService.fetchMemeCoins();
    res.json({ status: 'success', data: memeCoins });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
