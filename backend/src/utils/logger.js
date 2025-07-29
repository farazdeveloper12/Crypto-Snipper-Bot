// src/utils/logger.js
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get directory information
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Helper function to prevent circular JSON errors
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    return value;
  };
};

// Define log format
const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Create the winston logger instance
const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: winston.format.json()
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.json()
    })
  ]
});

// Custom Logger class for contextual logging
class Logger {
  constructor(context) {
    this.context = context;
  }
  info(message, data = {}) {
    winstonLogger.info(`[${this.context}] ${message}`, data);
  }
  warn(message, data = {}) {
    winstonLogger.warn(`[${this.context}] ${message}`, data);
  }
  error(message, data = {}) {
    winstonLogger.error(`[${this.context}] ${message}`, data);
  }
}

export { Logger, winstonLogger as globalLogger };
export default winstonLogger;