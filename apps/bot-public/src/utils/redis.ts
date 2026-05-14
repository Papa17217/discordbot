import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

export const redis = redisUrl
  ? new Redis(redisUrl, { maxRetriesPerRequest: 3 })
  : new Redis({ host: 'localhost', port: 6379, maxRetriesPerRequest: 3 });

redis.on('error', (err) => {
  console.warn('⚠️ Redis error:', err.message);
});
