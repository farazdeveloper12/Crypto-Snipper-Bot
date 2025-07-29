// backend/src/config/redis.js
const redis = require('redis');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.connect().then(() => {
  console.log('Connected to Redis');
});

module.exports = redisClient;