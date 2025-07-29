// src/middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(500).json({
    status: 'error',
    message: err.message || 'Bot initialization failed',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};