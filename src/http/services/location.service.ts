import { sequelize } from '../../config/dbConfig';
import { redisClient, redisPublisher } from '../../config/redis.config';
import { AttendanceRepository } from '../../repository/attendance.repository';
import { LocationRepository } from '../../repository/location.repository';
import { calculateHaversineDistance } from '../../utils/hervesin.util';
import { isWithinWorkingHours } from '../../utils/workingHours.util';

interface RedisUserState {
	status: 'in_office_area' | 'out_office_area';
	lastDistanceMark: number;
	lastIntervalTime: string | null;
	currentLat: number;
	currentLng: number;
	lastCheckinDate: string | null; // YYYY-MM-DD — ensures checkout pairs with correct date
}

export class LocationService {
	private static readonly OFFICE_LAT = parseFloat(process.env.OFFICE_LAT || '0');
	private static readonly OFFICE_LNG = parseFloat(process.env.OFFICE_LNG || '0');
	private static readonly OFFICE_RADIUS = parseFloat(process.env.OFFICE_RADIUS || '100');
	private static readonly DISTANCE_THRESHOLD = 500; // meters
	private static readonly TIME_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

	static async processPing(userId: string, lat: number, lng: number) {
		const transaction = await sequelize.transaction();
		const redisKey = `user:${userId}`;
		const now = new Date();
		const today = now.toISOString().split('T')[0];

		try {
			/* ==========================================================
				 1. Haversine distance from fixed office location
				 ========================================================== */
			const distance = calculateHaversineDistance(
				lat, lng, this.OFFICE_LAT, this.OFFICE_LNG
			);

			/* ==========================================================
				 2. Fetch real-time employee state from Redis
				 Key format: user:{userId}
				 ========================================================== */
			const redisData = await redisClient.get(redisKey);
			let state: RedisUserState = redisData ? JSON.parse(redisData) : {
				status: 'out_office_area',
				lastDistanceMark: 0,
				lastIntervalTime: null,
				currentLat: lat,
				currentLng: lng,
				lastCheckinDate: null
			};

			// Always update live coordinates in Redis
			state.currentLat = lat;
			state.currentLng = lng;

			const isInside = distance <= this.OFFICE_RADIUS;
			const isWorkingHours = isWithinWorkingHours(now);
			let locationLogged = false;

			if (isInside) {
				/* ==========================================================
					 3A. INSIDE GEOFENCE (<= 100m)
					 ========================================================== */
				if (state.status !== 'in_office_area') {
					// Transition: Outside → Inside → CHECK-IN event
					await AttendanceRepository.insertEvent({
						userId,
						eventDate: today,
						eventType: 'checkin',
						timestampEvent: now
					}, transaction);

					await LocationRepository.create({
						userId, latitude: lat, longitude: lng,
						isInside: true, distance: null, recordedAt: now, logType: 'checkin'
					}, transaction);

					state.lastCheckinDate = today;
					locationLogged = true;
				}

				// Reset outside-office tracking metrics
				state.status = 'in_office_area';
				state.lastDistanceMark = 0;
				state.lastIntervalTime = null;

			} else {
				/* ==========================================================
					 3B. OUTSIDE GEOFENCE (> 100m)
					 ========================================================== */
				if (state.status === 'in_office_area') {
					// Transition: Inside → Outside → CHECK-OUT event
					// Use lastCheckinDate so overnight checkouts map to the correct work day
					const checkoutDate = state.lastCheckinDate || today;

					await AttendanceRepository.insertEvent({
						userId,
						eventDate: checkoutDate,
						eventType: 'checkout',
						timestampEvent: now
					}, transaction);

					state.lastIntervalTime = now.toISOString(); // start 15-min timer
				}

				state.status = 'out_office_area';

				/* ----------------------------------------------------------
					 Distance & Interval logging ONLY during working hours
					 ---------------------------------------------------------- */
				if (isWorkingHours) {
					// Distance thresholds: 500m, 1000m, 1500m, 2000m...
					const currentMark = Math.floor(distance / this.DISTANCE_THRESHOLD) * this.DISTANCE_THRESHOLD;

					if (currentMark > (state.lastDistanceMark || 0)) {
						await LocationRepository.create({
							userId, latitude: lat, longitude: lng,
							isInside: false, distance, recordedAt: now, logType: 'distance'
						}, transaction);

						state.lastDistanceMark = currentMark;
						locationLogged = true;
					}

					// Time-based: log every 15 minutes when outside
					const lastInterval = state.lastIntervalTime ? new Date(state.lastIntervalTime) : null;
					const shouldLogByTime = !lastInterval || (now.getTime() - lastInterval.getTime()) >= this.TIME_INTERVAL_MS;

					if (shouldLogByTime && !locationLogged) {
						await LocationRepository.create({
							userId, latitude: lat, longitude: lng,
							isInside: false, distance, recordedAt: now, logType: 'interval'
						}, transaction);
						locationLogged = true;
					}

					if (locationLogged) {
						state.lastIntervalTime = now.toISOString();
					}
				}
			}

			await transaction.commit();

			/* ==========================================================
				 4. Persist updated state back to Redis
				 ========================================================== */
			await redisClient.set(redisKey, JSON.stringify(state));

			// Publish for horizontal scaling / future WebSocket consumers
			redisPublisher.publish('location:updates', JSON.stringify({
				userId, lat, lng, status: state.status, distance, timestamp: now.toISOString()
			}));

			return {
				distance: Math.round(distance * 100) / 100,
				status: state.status,
				isWorkingHours,
				locationLogged,
				officeLocation: { lat: this.OFFICE_LAT, lng: this.OFFICE_LNG }
			};

		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	}
}