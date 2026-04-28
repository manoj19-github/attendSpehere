import { sequelize } from "../../config/dbConfig";
import { redisClient, redisPublisher } from "../../config/redis.config";
import { AttendanceRepository } from "../../repository/attendance.repository";
import { LocationRepository } from "../../repository/location.repository";
import { calculateHaversineDistance } from "../../utils/hervesin.util";
import { isWithinWorkingHours } from "../../utils/workingHours.util";


interface RedisUserState {
	status: 'in_office_area' | 'out_office_area';
	lastDistanceMark: number;
	lastIntervalTime: string | null;
	currentLat: number;
	currentLng: number;
	firstCheckinDone: boolean; // Track if manual first checkin completed
	lastCheckinDate: string | null;
}

export class LocationService {
	private static readonly OFFICE_LAT = parseFloat(process.env.OFFICE_LAT || '0');
	private static readonly OFFICE_LNG = parseFloat(process.env.OFFICE_LNG || '0');
	private static readonly OFFICE_RADIUS = parseFloat(process.env.OFFICE_RADIUS || '100');
	private static readonly DISTANCE_THRESHOLD = 500;
	private static readonly TIME_INTERVAL_MS = 15 * 60 * 1000;

	static async processPing(userId: string, lat: number, lng: number) {
		const transaction = await sequelize.transaction();
		const redisKey = `user:${userId}`;
		const now = new Date();
		const today = now.toISOString().split('T')[0];

		try {
			/* ==========================================================
				 1. Calculate Haversine distance from office
				 ========================================================== */
			const distance = calculateHaversineDistance(
				lat, lng, this.OFFICE_LAT, this.OFFICE_LNG
			);

			/* ==========================================================
				 2. Fetch real-time state from Redis
				 ========================================================== */
			const redisData = await redisClient.get(redisKey);
			let state: RedisUserState = redisData ? JSON.parse(redisData) : {
				status: 'out_office_area',
				lastDistanceMark: 0,
				lastIntervalTime: null,
				currentLat: lat,
				currentLng: lng,
				firstCheckinDone: false,
				lastCheckinDate: null
			};

			// Always update live coordinates
			state.currentLat = lat;
			state.currentLng = lng;

			const isInside = distance <= this.OFFICE_RADIUS;
			const isWorkingHours = isWithinWorkingHours(now);
			let locationLogged = false;
			let attendanceEvent: 'checkin' | 'checkout' | null = null;

			if (!isWorkingHours) {
				// Outside working hours: only update Redis coords, no attendance logic
				await redisClient.set(redisKey, JSON.stringify(state));
				await transaction.commit();
				return {
					distance: Math.round(distance * 100) / 100,
					status: state.status,
					isWorkingHours: false,
					locationLogged: false,
					attendanceEvent: null,
					message: 'Outside working hours - tracking paused'
				};
			}

			if (isInside) {
				/* ==========================================================
					 INSIDE OFFICE (≤ 100m)
					 ========================================================== */
				if (state.status !== 'in_office_area') {
					// Transition: Outside → Inside

					// Check if first checkin done today
					if (!state.firstCheckinDone) {
						// First entry of day - require manual checkin (handled by separate API)
						// Just update status, don't auto checkin
						state.status = 'in_office_area';
					} else {
						// Re-entry after first manual checkin → AUTO CHECKIN
						await AttendanceRepository.insertEvent({
							userId, eventDate: today, eventType: 'checkin', timestampEvent: now
						}, transaction);

						await LocationRepository.create({
							userId, latitude: lat, longitude: lng,
							isInside: true, distance: null, recordedAt: now, logType: 'checkin'
						}, transaction);

						state.lastCheckinDate = today;
						attendanceEvent = 'checkin';
						locationLogged = true;
						state.status = 'in_office_area';
					}
				}

				// Reset outside tracking
				state.lastDistanceMark = 0;
				state.lastIntervalTime = null;

			} else {
				/* ==========================================================
					 OUTSIDE OFFICE (> 100m)
					 ========================================================== */
				if (state.status === 'in_office_area') {
					// Transition: Inside → Outside → AUTO CHECKOUT
					const checkoutDate = state.lastCheckinDate || today;

					await AttendanceRepository.insertEvent({
						userId, eventDate: checkoutDate, eventType: 'checkout', timestampEvent: now
					}, transaction);

					attendanceEvent = 'checkout';
					state.lastIntervalTime = now.toISOString();
				}

				state.status = 'out_office_area';

				// Distance-based logging (500m, 1000m, 1500m...)
				const currentMark = Math.floor(distance / this.DISTANCE_THRESHOLD) * this.DISTANCE_THRESHOLD;
				if (currentMark > (state.lastDistanceMark || 0)) {
					await LocationRepository.create({
						userId, latitude: lat, longitude: lng,
						isInside: false, distance, recordedAt: now, logType: 'distance'
					}, transaction);
					state.lastDistanceMark = currentMark;
					locationLogged = true;
				}

				// Time-based logging (every 15 min)
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

			await transaction.commit();
			await redisClient.set(redisKey, JSON.stringify(state));

			// Publish for real-time updates
			redisPublisher.publish('location:updates', JSON.stringify({
				userId, lat, lng, status: state.status, distance,
				attendanceEvent, timestamp: now.toISOString()
			}));

			return {
				distance: Math.round(distance * 100) / 100,
				status: state.status,
				isWorkingHours,
				locationLogged,
				attendanceEvent,
				firstCheckinDone: state.firstCheckinDone,
				officeLocation: { lat: this.OFFICE_LAT, lng: this.OFFICE_LNG }
			};

		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	}

	/**
	 * Manual first checkin of the day
	 */
	static async manualCheckin(userId: string, lat: number, lng: number) {
		const transaction = await sequelize.transaction();
		const redisKey = `user:${userId}`;
		const now = new Date();
		const today = now.toISOString().split('T')[0];

		try {
			const distance = calculateHaversineDistance(
				lat, lng, this.OFFICE_LAT, this.OFFICE_LNG
			);

			if (distance > this.OFFICE_RADIUS) {
				throw new Error('You must be within office premises to check in');
			}

			// Insert checkin event
			await AttendanceRepository.insertEvent({
				userId, eventDate: today, eventType: 'checkin', timestampEvent: now
			}, transaction);

			await LocationRepository.create({
				userId, latitude: lat, longitude: lng,
				isInside: true, distance: null, recordedAt: now, logType: 'checkin'
			}, transaction);

			// Update Redis state
			const redisData = await redisClient.get(redisKey);
			let state: RedisUserState = redisData ? JSON.parse(redisData) : {
				status: 'out_office_area',
				lastDistanceMark: 0,
				lastIntervalTime: null,
				currentLat: lat,
				currentLng: lng,
				firstCheckinDone: false,
				lastCheckinDate: null
			};

			state.status = 'in_office_area';
			state.firstCheckinDone = true;
			state.lastCheckinDate = today;
			state.currentLat = lat;
			state.currentLng = lng;

			await transaction.commit();
			await redisClient.set(redisKey, JSON.stringify(state));

			return {
				distance: Math.round(distance * 100) / 100,
				status: 'in_office_area',
				message: 'Check-in successful'
			};

		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	}
}