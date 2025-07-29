import rateLimit from 'express-rate-limit';
import Logger from '../utils/logger.js';

const logger = new Logger('rate-limiter');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next, options) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
      });

      res.status(options.statusCode || 429).send({ error: options.message });
    },
  };

  const limiterOptions = { ...defaultOptions, ...options };
  return rateLimit(limiterOptions);
};

// Export multiple rate limiters
export const generalLimiter = createRateLimiter();
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts
  message: 'Too many login attempts, please try again later',
});
export const tradingLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 trading actions per hour
  message: 'Trading rate limit exceeded',
});

export default apiLimiter;
