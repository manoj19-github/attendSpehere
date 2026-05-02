import { Server as HttpServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { redisClient } from './redis.config';

import { LocationService } from '../http/services/location.service';
import { logger } from '../utils/logger';

let io: SocketIOServer;

export const initializeSocketIO = (server: HttpServer): SocketIOServer => {
	io = new SocketIOServer(server, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
		},
		transports: ['websocket', 'polling'],
	});

	// Create dedicated Redis subscriber for pub/sub
	const redisSubscriber = redisClient.duplicate
		? redisClient.duplicate()
		: redisClient; // fallback if duplicate unavailable

	redisSubscriber.subscribe('location:updates');

	redisSubscriber.on('message', (channel: string, message: string) => {
		if (channel === 'location:updates') {
			try {
				const payload = JSON.parse(message);
				// Broadcast to all connected clients
				io.emit('location:update', payload);
			} catch (err) {
				logger.error('Socket Redis parse error:', err);
			}
		}
	});

	io.on('connection', async (socket: Socket) => {
		logger.info(`⚡ Socket connected: ${socket.id}`);

		// Feature 4: Emit latest all-user locations immediately on connect
		try {
			const latestLocations = await LocationService.getAllUsersLatestLocation();
			socket.emit('location:latest-all', {
				timestamp: new Date().toISOString(),
				count: latestLocations.length,
				users: latestLocations,
			});
		} catch (err) {
			logger.error('Socket initial emit error:', err);
			socket.emit('location:error', { message: 'Failed to fetch latest locations' });
		}

		socket.on('disconnect', () => {
			logger.info(`🔌 Socket disconnected: ${socket.id}`);
		});
	});

	return io;
};

export const getIO = (): SocketIOServer => {
	if (!io) throw new Error('Socket.io not initialized!');
	return io;
};