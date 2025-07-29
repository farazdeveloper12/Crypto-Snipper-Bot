import express from 'express';
import { getLivePrice } from '../services/data-fetcher.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ status: "error", message: "Token is required!" });
  }

  try {
    const price = await getLivePrice(token);
    res.json({ status: "success", token, price });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;
