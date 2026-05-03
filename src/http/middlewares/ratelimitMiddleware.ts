// middlewares/locationRateLimit.ts

import { NextFunction, Request, Response } from 'express';
import { redisClient } from '../../config/redis.config';

const WINDOW_SECONDS = 5;
const MAX_REQUESTS = 2;

export const authenticateRatelimiter = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user.id;
		const key = `loc_rate:${userId}`;

		// Increment request count
		const currentCount = await redisClient.incr(key);

		// Set expiry only on first request
		if (currentCount === 1) {
			await redisClient.expire(key, WINDOW_SECONDS);
		}

		if (currentCount > MAX_REQUESTS) {
			return res.status(429).json({
				success: false,
				message: 'Too many location updates',
			});
		}

		next();
	} catch (err) {
		console.error(err);
		next(); // don't block if Redis fails
	}
};