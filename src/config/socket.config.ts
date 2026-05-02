import { Server as HttpServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { LocationService } from "../http/services/location.service";
import { logger } from "../utils/logger";
import { redisSubscriber } from './redis.config';

let io: SocketIOServer;
let isSubscribed = false;

export const initializeSocketIO = async (
	server: HttpServer
): Promise<SocketIOServer> => {

	io = new SocketIOServer(server, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
		},
		transports: ['websocket', 'polling'],
	});

	const handleLocationUpdate = (channel: string, message: string) => {
		if (channel === 'location:updates') {
			try {
				const payload = JSON.parse(message);
				io.emit('location:update', payload);
			} catch (err) {
				logger.error('Socket Redis parse error:', err);
			}
		}
	};

	// ✅ Prevent duplicate subscription (safe way)


	// if (!isSubscribed) {
	// 	isSubscribed = true;
	// 	await redisSubscriber.subscribe('location:updates');
	// 	redisSubscriber.on('message', handleLocationUpdate);
	// }
	const subscribe = async () => {
		if (isSubscribed) return;

		isSubscribed = true;
		await redisSubscriber.subscribe('location:updates');
		redisSubscriber.off("message", handleLocationUpdate);
		redisSubscriber.on('message', handleLocationUpdate);
	};

	// ✅ initial subscribe
	await subscribe();

	// ✅ reconnect safety
	redisSubscriber.on('connect', subscribe);

	io.on('connection', async (socket: Socket) => {
		logger.info(`⚡ Socket connected: ${socket.id}`);

		try {
			const latestLocations =
				await LocationService.getAllUsersLatestLocation();

			socket.emit('location:latest-all', {
				timestamp: new Date().toISOString(),
				count: latestLocations.length,
				users: latestLocations,
			});

		} catch (err) {
			logger.error('Socket initial emit error:', err);
			socket.emit('location:error', {
				message: 'Failed to fetch latest locations',
			});
		}

		socket.on('disconnect', () => {
			logger.info(`🔌 Socket disconnected: ${socket.id}`);
		});
	});

	return io;
};