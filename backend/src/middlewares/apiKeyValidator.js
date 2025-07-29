// src/middleware/apiKeyValidator.js
import logger from '../utils/logger.js';
import ApiKeyService from '../services/apiKeyService.js';

export const validateApiKey = (requiredServices = []) => {
  return (req, res, next) => {
    try {
      // Check each required service
      requiredServices.forEach(service => {
        ApiKeyService.getKey(service);
      });
      next();
    } catch (error) {
      logger.error(`API Key Validation Failed: ${error.message}`);
      res.status(500).json({
        error: 'API configuration incomplete',
        missingServices: requiredServices
      });
    }
  };
};