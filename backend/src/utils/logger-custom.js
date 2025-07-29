// backend/src/utils/logger-custom.js
const winston = require('winston');
const path = require('path');

class CustomLogger {
  constructor() {
    // Create logs directory if it doesn't exist
    const logDir = path.join(__dirname, '../../logs');
    
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      defaultMeta: { service: 'crypto-sniper-bot' },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        
        // File transport for errors
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        
        // Combined log file
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });
  }

  log(level, message, meta = {}) {
    this.logger.log(level, message, meta);
  }

  error(message, error) {
    this.logger.error(message, {
      error: error instanceof Error ? error.stack : error
    });
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
}

module.exports = new CustomLogger();