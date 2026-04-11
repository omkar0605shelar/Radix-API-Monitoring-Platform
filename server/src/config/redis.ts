import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

if (!process.env.REDIS_URL) {
  console.warn('⚠️  REDIS_URL not found in environment variables. Defaulting to redis://localhost:6379');
}

const redisClient = createClient({
  url: REDIS_URL,
  pingInterval: 30000, // Send a ping every 30 seconds to keep connection alive
  socket: {
    keepAlive: 30000,
    reconnectStrategy: (retries) => {
      // Exponential backoff or simple delay
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on('error', (err) => {
  // Ignore "Socket closed unexpectedly" logs as they are handled by auto-reconnect
  if (err.message === 'Socket closed unexpectedly') return;

  console.error('❌ Redis Client Error:', err.message);
  if (err.code === 'ECONNREFUSED') {
    console.error('👉 Make sure Redis is running and accessible at', REDIS_URL);
  }
});

redisClient.on('connect', () => {
  // Only log once to avoid flooding the console during reconnection
});

// Added a ready listener for a better indication of operational state
redisClient.on('ready', () => console.log('✅ Redis Client Ready & Operational'));

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err: any) {
    console.error('❌ Failed to connect to Redis:', err.message);
  }
};

export default redisClient;
