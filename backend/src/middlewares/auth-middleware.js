// backend/src/middlewares/auth-middleware.js
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js'; // ✅ Use logger instance
import speakeasy from 'speakeasy';

const authMiddleware = {
  authenticate: (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No authentication token' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      logger.error('Authentication failed', error);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  },

  generate2FA: () => {
    return speakeasy.generateSecret({ length: 20 });
  },

  verify2FA: (token, secret) => {
    return speakeasy.totp.verify({ secret, encoding: 'base32', token });
  }
};

export default authMiddleware;
