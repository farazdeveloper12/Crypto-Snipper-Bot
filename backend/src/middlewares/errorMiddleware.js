// src/middlewares/errorMiddleware.js
import { logger } from '../utils/logger.js';

export const errorMiddleware = (err, req, res, next) => {
  // Log the error for server-side debugging
  logger.error(`Error: ${err.message}`);
  logger.debug(err.stack);
  
  // Set status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Send error response
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
};

// Custom error handler
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};