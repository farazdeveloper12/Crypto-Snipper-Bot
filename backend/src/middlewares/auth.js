// src/middlewares/auth.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const auth = async (req, res, next) => {
  try {
    // Skip authentication for specific endpoints that don't require it
    const publicPaths = [
      '/health',
      '/api/wallet/connect',
      '/api/wallet/balance'
    ];
    
    const isPublicPath = publicPaths.some(path => 
      req.path === path || req.path.startsWith(`${path}/`)
    );
    
    if (isPublicPath) {
      return next();
    }
    
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. No token provided.'
      });
    }
    
    // Extract token from "Bearer [token]"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Token not found.'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired. Please log in again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please log in again.'
      });
    }
    
    return res.status(401).json({
      status: 'error',
      message: 'Authentication failed.'
    });
  }
};

export default auth;