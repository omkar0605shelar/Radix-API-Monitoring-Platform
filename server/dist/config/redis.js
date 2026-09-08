import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
if (!process.env.REDIS_URL) {
    console.warn('⚠️  REDIS_URL not found in environment variables. Defaulting to redis://localhost:6379');
}
const redisClient = createClient({
    url: REDIS_URL,
    disableOfflineQueue: true, // Fail immediately rather than hanging promises if Redis is offline
    pingInterval: 30000,
    socket: {
        connectTimeout: 3000,
        keepAlive: 30000,
        reconnectStrategy: (retries) => {
            if (retries > 3) {
                return false; // Stop reconnecting after 3 failed attempts
            }
            return 1000;
        }
    }
});
redisClient.on('error', (err) => {
    // Silent handling of standard socket closures
    if (err.message === 'Socket closed unexpectedly' || err.code === 'ECONNRESET') {
        return;
    }
    console.error('❌ Redis Client Error:', err.message);
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        console.error('👉 Redis connection unreachable at', REDIS_URL);
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
    }
    catch (err) {
        console.error('❌ Failed to connect to Redis:', err.message);
    }
};
export default redisClient;
