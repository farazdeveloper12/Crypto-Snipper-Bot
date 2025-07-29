// src/config/database.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

export const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    // Log connection attempt with sanitized URI (hiding password)
    const sanitizedUri = mongoURI.replace(/:([^@]+)@/, ':****@');
    logger.info(`Attempting to connect to MongoDB: ${sanitizedUri}`);
    
    // MongoDB connection options
    const options = {
      autoIndex: true, // Build indexes
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };
    
    // Connect to MongoDB
    await mongoose.connect(mongoURI, options);
    
    logger.info('MongoDB connection established successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed due to app termination');
        process.exit(0);
      } catch (err) {
        logger.error(`Error closing MongoDB connection: ${err}`);
        process.exit(1);
      }
    });
    
    return mongoose.connection;
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error.message}`);
    if (error.name === 'MongoServerSelectionError') {
      logger.error('This might be due to network issues or IP whitelist settings.');
      logger.error('Make sure your IP is whitelisted in MongoDB Atlas.');
    }
    if (error.name === 'MongoError' && error.code === 18) {
      logger.error('Authentication failed. Check your username and password.');
    }
    
    // Don't exit the process, let the application handle it
    throw error;
  }
};

export default connectDatabase;