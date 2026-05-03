import { Transaction } from "sequelize";
import { sequelize } from "../../config/dbConfig";
import { redisClient, redisPublisher } from "../../config/redis.config";
import { AttendanceRepository } from "../../repository/attendance.repository";
import { LocationRepository } from "../../repository/location.repository";
import { RedisUserState } from "../../types";
import { INACTIVE_THRESHOLD } from "../../utils/constants.util";
import { calculateHaversineDistance } from "../../utils/hervesin.util";
import { logger } from "../../utils/logger";
import { isWithinWorkingHours } from "../../utils/workingHours.util";
import { HttpException } from "../exceptions/http.exceptions";
import { OfficeSettingsService } from "./officeSettings.service";


export class LocationService {


	/* ==========================================================
		 🧠 REDIS HELPERS
	========================================================== */

	private static getToday() {
		return new Date().toISOString().split('T')[0];
	}

	private static getAttendanceKey(userId: string, date: string) {
		return `attendance:${userId}:${date}`;
	}

	public static async cleanOldKeys(userId: string) {
		const keys = await redisClient.keys(`attendance:${userId}:*`);

		const today = this.getToday();

		for (const key of keys) {
			if (!key.includes(today)) {
				await redisClient.del(key);
			}
		}
	}

	private static getSecondsUntilMidnight() {
		const now = new Date();
		const midnight = new Date();
		midnight.setHours(23, 59, 59, 999);
		return Math.floor((midnight.getTime() - now.getTime()) / 1000);
	}

	private static async addEventToRedis(
		userId: string,
		type: 'checkin' | 'checkout',
		now: Date
	) {
		const today = LocationService.getToday();
		const key = LocationService.getAttendanceKey(userId, today);
		await LocationService.cleanOldKeys(userId);

		const event = JSON.stringify({
			type,
			time: now.toISOString()
		});

		await redisClient.rpush(key, event);

		const ttl = await redisClient.ttl(key);
		if (ttl === -1) {
			await redisClient.expire(key, this.getSecondsUntilMidnight());
		}
	}

	private static async calculateWorkingHours(userId: string) {
		const today = this.getToday();
		const key = this.getAttendanceKey(userId, today);

		const eventsRaw = await redisClient.lrange(key, 0, -1);
		if (!eventsRaw.length) return 0;

		const events = eventsRaw.map(e => JSON.parse(e));

		let totalMinutes = 0;
		let lastCheckin: Date | null = null;

		for (const event of events) {
			if (event.type === 'checkin') {
				lastCheckin = new Date(event.time);
			} else if (event.type === 'checkout' && lastCheckin) {
				totalMinutes +=
					(new Date(event.time).getTime() - lastCheckin.getTime()) / (1000 * 60);
				lastCheckin = null;
			}
		}

		if (lastCheckin) {
			totalMinutes += (Date.now() - lastCheckin.getTime()) / (1000 * 60);
		}

		return Math.round((totalMinutes / 60) * 100) / 100;
	}

	/* ==========================================================
		 🚀 MAIN SERVICE
	========================================================== */


	static async processPing(
		userId: string,
		lat: number,
		lng: number,
		fullName?: string,
		email?: string
	) {
		const transaction = await sequelize.transaction();
		const redisKey = `user:${userId}`;
		const now = new Date();
		const today = this.getToday();



		try {
			const officeConfig = await OfficeSettingsService.getConfig();

			const distance = calculateHaversineDistance(
				lat,
				lng,
				officeConfig.OFFICE_LAT,
				officeConfig.OFFICE_LNG
			);

			logger.info(`📍 User ${userId} is checking in at ${lat}, ${lng}`);
			logger.info(`📍 Distance: ${distance}`);

			const redisData = await redisClient.get(redisKey);

			let state: RedisUserState = redisData
				? JSON.parse(redisData)
				: {
					status: 'out_office_area',
					lastDistanceMark: 0,
					lastIntervalTime: null,
					lastEmitTime: null,
					currentLat: lat,
					currentLng: lng,
					lastCheckinDate: null,
					fullName,
					email,
					lastSeen: null
				};

			// const prevLat = state.currentLat;
			// const prevLng = state.currentLng;

			// ✅ update state
			state.currentLat = lat;
			state.currentLng = lng;
			state.fullName = fullName;
			state.email = email;
			state.distance = distance;
			state.lastSeen = now.toISOString(); // ⭐ IMPORTANT

			// const movement = calculateHaversineDistance(prevLat, prevLng, lat, lng);

			const firstCheckinDone = state.lastCheckinDate === today;
			const isInside = distance <= officeConfig.OFFICE_RADIUS;
			console.log('isInside: ', isInside);
			const isWorkingHours = isWithinWorkingHours({ now, officeConfig });
			console.log("isWorkingHours >>> 159 >> ", isWorkingHours);

			let locationLogged = false;
			let attendanceEvent: 'checkin' | 'checkout' | null = null;

			/* ================= OUTSIDE WORKING HOURS ================= */
			if (!isWorkingHours) {
				await redisClient.set(redisKey, JSON.stringify(state));
				await transaction.commit();

				return {
					distance,
					status: state.status,
					isWorkingHours,
					attendanceEvent: null,
					totalHours: await this.calculateWorkingHours(userId),
				};
			}

			/* ================= INSIDE ================= */
			if (isInside) {
				console.log("state.status  >>> ", state.status);
				if (state.status !== 'in_office_area') {
					if (!firstCheckinDone) {
						await AttendanceRepository.insertEvent(
							{
								userId,
								eventDate: today,
								eventType: 'checkin',
								timestampEvent: now,
								latitude: lat,
								longitude: lng,
								distance,
							},
							transaction
						);

						await this.addEventToRedis(userId, 'checkin', now);

						state.lastCheckinDate = today;
						attendanceEvent = 'checkin';
					}

					state.status = 'in_office_area';
				}

				state.lastDistanceMark = 0;
				state.lastIntervalTime = null;
			}

			/* ================= OUTSIDE ================= */
			else {
				if (state.status === 'in_office_area') {
					const checkoutDate = state.lastCheckinDate || today;

					const getLastAttendanceEvent = await LocationRepository.getLastAttendanceEvent(userId);




					if (getLastAttendanceEvent === "in_office_area") {
						await AttendanceRepository.insertEvent(
							{
								userId,
								eventDate: checkoutDate,
								eventType: 'checkout',
								timestampEvent: now,
								latitude: lat,
								longitude: lng,
								distance,
							},
							transaction
						);

						await this.addEventToRedis(userId, 'checkout', now);


						attendanceEvent = 'checkout';
					}
				}


				state.status = 'out_office_area';

				const currentMark =
					Math.floor(distance / officeConfig.DISTANCE_THRESHOLD) *
					officeConfig.DISTANCE_THRESHOLD;

				if (currentMark > state.lastDistanceMark) {
					await LocationRepository.create(
						{
							userId,
							latitude: lat,
							longitude: lng,
							isInside: false,
							distance,
							recordedAt: now,
							logType: 'distance',
						},
						transaction
					);

					state.lastDistanceMark = currentMark;
					locationLogged = true;
				}

				const lastInterval = state.lastIntervalTime
					? new Date(state.lastIntervalTime)
					: null;

				const shouldLogByTime =
					!lastInterval ||
					now.getTime() - lastInterval.getTime() >=
					officeConfig.TIME_INTERVAL_MS;

				if (shouldLogByTime && !locationLogged) {
					await LocationRepository.create(
						{
							userId,
							latitude: lat,
							longitude: lng,
							isInside: false,
							distance,
							recordedAt: now,
							logType: 'interval',
						},
						transaction
					);

					locationLogged = true;
				}

				if (locationLogged) {
					state.lastIntervalTime = now.toISOString();
				}
			}

			await transaction.commit();

			const totalHours = await this.calculateWorkingHours(userId);

			/* ================= SOCKET EMIT ================= */

			const lastEmit = state.lastEmitTime
				? new Date(state.lastEmitTime)
				: null;

			const shouldEmitByTime =
				!lastEmit || now.getTime() - lastEmit.getTime() > 10000;



			if (shouldEmitByTime) {
				await redisPublisher.publish(
					'location:updates',
					JSON.stringify({
						userId,
						lat,
						lng,
						status: state.status,
						distance,
						attendanceEvent,
						totalHours,
						timestamp: now.toISOString(),
						fullName,
						email,
						lastSeen: state.lastSeen,
						lastEmitTime: state.lastEmitTime,
						lastIntervalTime: state.lastIntervalTime

					})
				);

				state.lastEmitTime = now.toISOString();
			}

			// ✅ SINGLE REDIS WRITE
			await redisClient.set(redisKey, JSON.stringify(state));

			return {
				distance: Math.round(distance * 100) / 100,
				status: state.status,
				isWorkingHours,
				attendanceEvent,
				firstCheckinDone,
				lastSeen: state.lastSeen,
				lastEmitTime: state.lastEmitTime,
				lastIntervalTime: state.lastIntervalTime,
				totalHours,
				officeLocation: {
					lat: officeConfig.OFFICE_LAT,
					lng: officeConfig.OFFICE_LNG,
				},
			};
		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	}
	static async manualCheckin(userId: string, lat: number, lng: number, fullName?: string, email?: string) {
		const transaction = await sequelize.transaction();
		const redisKey = `user:${userId}`;
		const now = new Date();
		const today = this.getToday();

		try {
			const officeConfig = await OfficeSettingsService.getConfig();
			const distance = calculateHaversineDistance(
				lat, lng, officeConfig.OFFICE_LAT, officeConfig.OFFICE_LNG
			);

			if (distance > officeConfig.OFFICE_RADIUS) {
				throw new HttpException(400, 'You must be inside office');
			}

			await AttendanceRepository.insertEvent({
				userId,
				eventDate: today,
				eventType: 'checkin',
				timestampEvent: now,
				latitude: lat,
				longitude: lng,
				distance: distance,
			}, transaction);

			await this.addEventToRedis(userId, 'checkin', now);

			const redisData = await redisClient.get(redisKey);

			let state: RedisUserState = redisData
				? JSON.parse(redisData)
				: {
					status: 'out_office_area',
					lastDistanceMark: 0,
					lastIntervalTime: null,
					currentLat: lat,
					currentLng: lng,
					lastCheckinDate: null,
					fullName: fullName,
					email: email
				};

			state.status = 'in_office_area';
			state.lastCheckinDate = today;
			state.currentLat = lat;
			state.currentLng = lng;
			state.fullName = fullName;
			state.email = email;

			await transaction.commit();
			await redisClient.set(redisKey, JSON.stringify(state));

			return {
				status: 'in_office_area',
				message: 'Check-in successful'
			};

		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	}

	static async manualCheckout(
		userId: string,
		lat: number,
		lng: number,
		fullName?: string,
		email?: string
	) {
		let transaction: Transaction | undefined;
		try {
			transaction = await sequelize.transaction();
			const officeConfig = await OfficeSettingsService.getConfig();
			const redisKey = `user:${userId}`;
			const now = new Date();
			const today = this.getToday();
			const distance = calculateHaversineDistance(
				lat, lng, officeConfig.OFFICE_LAT, officeConfig.OFFICE_LNG
			);


			// 1. Verify user has a checkin today
			const todayEvents = await AttendanceRepository.getTodayEvents(userId);

			if (!todayEvents || todayEvents.length === 0) {
				throw new HttpException(400, 'No attendance record found for today');
			}

			const lastEvent = todayEvents[todayEvents.length - 1];
			if (lastEvent.event_type !== 'checkin') {
				throw new HttpException(400, 'You are not currently checked in');
			}

			// 2. Insert checkout event (NO distance check — allows outside-office checkout)
			await AttendanceRepository.insertEvent(
				{
					userId,
					eventDate: today,
					eventType: 'checkout',
					timestampEvent: now,
					latitude: lat ?? 0,
					longitude: lng ?? 0,
					distance
				},
				transaction
			);

			// 3. Push to Redis stream
			await this.addEventToRedis(userId, 'checkout', now);

			// 4. Update Redis user state
			const redisData = await redisClient.get(redisKey);
			let state: RedisUserState = redisData
				? JSON.parse(redisData)
				: {
					status: 'out_office_area',
					lastDistanceMark: 0,
					lastIntervalTime: null,
					currentLat: lat,
					currentLng: lng,

					lastCheckinDate: null,
					fullName: fullName,
					email: email
				};

			state.status = 'out_office_area';
			state.currentLat = lat ?? 0;
			state.currentLng = lng ?? 0;
			state.lastDistanceMark = distance
			state.fullName = fullName;
			state.email = email;

			await transaction.commit();
			await redisClient.set(redisKey, JSON.stringify(state));

			return {
				status: 'out_office_area',
				message: 'Check-out successful',
				checkoutTime: now.toISOString(),
			};
		} catch (error) {
			await transaction?.rollback();

		}
	}

	static async getAllUsersLatestLocation() {
		try {
			const users: any[] = [];
			let cursor = '0';


			const now = Date.now();

			do {
				const [nextCursor, keys] = await redisClient.scan(
					cursor,
					'MATCH',
					'user:*',
					'COUNT',
					50
				);

				cursor = nextCursor;

				if (keys.length === 0) continue;

				const values = await redisClient.mget(keys);

				for (let i = 0; i < values.length; i++) {
					const raw = values[i];
					if (!raw) continue;

					try {
						const state = JSON.parse(raw);

						const lastSeen = state.lastSeen
							? new Date(state.lastSeen).getTime()
							: 0;

						const isActive = now - lastSeen <= INACTIVE_THRESHOLD;

						if (!isActive) continue; // ❌ skip inactive user

						const userId = keys[i].replace('user:', '');

						users.push({
							userId,
							latitude: state.currentLat,
							longitude: state.currentLng,
							status: state.status,
							recordedAt: state.lastSeen,
							fullName: state.fullName,
							email: state.email,
							source: 'redis',
						});

					} catch {
						console.warn('Invalid JSON:', keys[i]);
					}
				}

			} while (cursor !== '0');

			return users;

		} catch (error) {
			throw error;
		}
	}

	/**
	 * ✅ NEW: Get user's raw GPS location history
	 */
	static async getUserLocationHistory({ userId, startDate, endDate, page, limit, search }: { userId?: string, startDate: string, endDate: string, page: number; limit: number; search?: string }) {
		return LocationRepository.findLocationByDateRange({ userId, startDate, endDate, page, search, limit });
	}




}