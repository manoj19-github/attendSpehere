import Redis from 'ioredis';
import "../config/env.config";
import { logger } from '../utils/logger';

export const redisClient = new Redis({
	host: process.env.REDIS_HOST || 'localhost',
	port: parseInt(process.env.REDIS_PORT || '6379'),
	password: process.env.REDIS_PASSWORD,   // 🔥 ADD THIS
	maxRetriesPerRequest: null,
	enableReadyCheck: false
});

redisClient.on('connect', () => logger.info('Redis connected'));
redisClient.on('error', (err) => console.error('Redis error:', err));

/*
 * Pub/Sub setup for horizontal scaling.
 * Multiple server instances can publish location events
 * and broadcast to connected clients via WebSocket/SSE later.
 */
export const redisPublisher = new Redis({
	host: process.env.REDIS_HOST || 'localhost',
	port: parseInt(process.env.REDIS_PORT || '6379'),
	password: process.env.REDIS_PASSWORD,   // 🔥 ADD THIS
	maxRetriesPerRequest: null,
	enableReadyCheck: false
});

export const redisSubscriber = new Redis({
	host: process.env.REDIS_HOST || 'localhost',
	port: parseInt(process.env.REDIS_PORT || '6379'),
	password: process.env.REDIS_PASSWORD,   // 🔥 ADD THIS
	maxRetriesPerRequest: null,
	enableReadyCheck: false
});

