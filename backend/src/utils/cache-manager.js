// backend/src/utils/cache-manager.js
const redis = require('redis');
const { promisify } = require('util');

class CacheManager {
  constructor() {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });

    // Promisify redis methods
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });
  }

  async set(key, value, expiration = 3600) {
    try {
      // Convert value to string
      const stringValue = JSON.stringify(value);
      await this.setAsync(key, stringValue, 'EX', expiration);
    } catch (error) {
      console.error('Cache set error', error);
    }
  }

  async get(key) {
    try {
      const cachedValue = await this.getAsync(key);
      return cachedValue ? JSON.parse(cachedValue) : null;
    } catch (error) {
      console.error('Cache get error', error);
      return null;
    }
  }

  async delete(key) {
    try {
      await this.delAsync(key);
    } catch (error) {
      console.error('Cache delete error', error);
    }
  }

  // Cache token price
  async cacheTokenPrice(tokenAddress, price) {
    const key = `token_price:${tokenAddress}`;
    await this.set(key, price, 300); // 5 minutes cache
  }

  // Get cached token price
  async getCachedTokenPrice(tokenAddress) {
    const key = `token_price:${tokenAddress}`;
    return this.get(key);
  }
}

module.exports = new CacheManager();