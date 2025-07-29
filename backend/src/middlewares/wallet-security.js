// backend/src/middleware/wallet-security.js
export const walletRateLimiter = (req, res, next) => {
  const user = req.user;
  if (user.walletAuthAttempts >= 5) {
    const timeDiff = Date.now() - user.lastWalletAuth;
    if (timeDiff < 15 * 60 * 1000) { // 15 minute lockout
      return res.status(429).json({ error: 'Too many attempts. Try again later' });
    }
  }
  next();
};