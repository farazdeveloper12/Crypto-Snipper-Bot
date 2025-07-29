import express from 'express';
import { detectScamToken } from '../utils/scam-detector.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ status: "error", message: "Token is required!" });
  }

  try {
    const result = await detectScamToken(token);
    res.json({ status: "success", result });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;
