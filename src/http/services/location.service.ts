import { Transaction } from "sequelize";
import { sequelize } from "../../config/dbConfig";
import { redisClient, redisPublisher } from "../../config/redis.config";
import { AttendanceRepository } from "../../repository/attendance.repository";
import { LocationRepository } from "../../repository/location.repository";
import { RedisUserState } from "../../types";
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

	static async processPing(userId: string, lat: number, lng: number, fullName?: string, email?: string) {
		const transaction = await sequelize.transaction();
		const redisKey = `user:${userId}`;
		const now = new Date();
		const today = this.getToday();



		try {
			const officeConfig = await OfficeSettingsService.getConfig();
			const distance = calculateHaversineDistance(
				lat, lng, officeConfig.OFFICE_LAT, officeConfig.OFFICE_LNG
			);

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

			state.currentLat = lat;
			state.currentLng = lng;
			state.fullName = fullName;
			state.email = email;

			const firstCheckinDone = state.lastCheckinDate === today;
			logger.info("distance >>> 125 >> ", distance);
			logger.info("distance >>> 125 >> ", distance);
			const isInside = distance <= officeConfig.OFFICE_RADIUS;
			const isWorkingHours = isWithinWorkingHours(now);

			let locationLogged = false;
			let attendanceEvent: 'checkin' | 'checkout' | null = null;

			if (!isWorkingHours) {
				await redisClient.set(redisKey, JSON.stringify(state));
				await transaction.commit();

				return {
					distance,
					status: state.status,
					isWorkingHours,
					attendanceEvent: null,
					totalHours: await this.calculateWorkingHours(userId)
				};
			}

			/* ================= INSIDE ================= */
			if (isInside) {
				if (state.status !== 'in_office_area') {
					if (firstCheckinDone) {
						// AUTO CHECKIN
						await AttendanceRepository.insertEvent({
							userId,
							eventDate: today,
							eventType: 'checkin',
							latitude: lat,
							longitude: lng,
							distance,
							timestampEvent: now
						}, transaction);

						await this.addEventToRedis(userId, 'checkin', now);

						state.lastCheckinDate = today;
						attendanceEvent = 'checkin';
						locationLogged = true;
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

					await AttendanceRepository.insertEvent({
						userId,
						eventDate: checkoutDate,
						eventType: 'checkout',
						timestampEvent: now,
						latitude: lat,
						longitude: lng,
						distance: distance,
					}, transaction);

					await this.addEventToRedis(userId, 'checkout', now);

					attendanceEvent = 'checkout';
				}

				state.status = 'out_office_area';
				state.fullName = fullName;
				state.email = email;

				const currentMark =
					Math.floor(distance / officeConfig.DISTANCE_THRESHOLD) *
					officeConfig.DISTANCE_THRESHOLD;

				if (currentMark > state.lastDistanceMark) {
					await LocationRepository.create({
						userId,
						latitude: lat,
						longitude: lng,
						isInside: false,
						distance,
						recordedAt: now,
						logType: 'distance'
					}, transaction);

					state.lastDistanceMark = currentMark;
					locationLogged = true;
				}

				const lastInterval = state.lastIntervalTime
					? new Date(state.lastIntervalTime)
					: null;

				const shouldLogByTime =
					!lastInterval ||
					now.getTime() - lastInterval.getTime() >= officeConfig.TIME_INTERVAL_MS;

				if (shouldLogByTime && !locationLogged) {
					await LocationRepository.create({
						userId,
						latitude: lat,
						longitude: lng,
						isInside: false,
						distance,
						recordedAt: now,
						logType: 'interval'
					}, transaction);

					locationLogged = true;
				}

				if (locationLogged) {
					state.lastIntervalTime = now.toISOString();
				}
			}

			await transaction.commit();
			await redisClient.set(redisKey, JSON.stringify(state));

			const totalHours = await this.calculateWorkingHours(userId);

			redisPublisher.publish('location:updates', JSON.stringify({
				userId,
				lat,
				lng,
				status: state.status,
				distance,
				attendanceEvent,
				totalHours,
				timestamp: now.toISOString(),
				fullName: fullName,
				email: email
			}));

			return {
				distance: Math.round(distance * 100) / 100,
				status: state.status,
				isWorkingHours,
				attendanceEvent,
				firstCheckinDone,
				totalHours,
				officeLocation: {
					lat: officeConfig.OFFICE_LAT,
					lng: officeConfig.OFFICE_LNG
				}
			};

		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	}

	/* ==========================================================
		 ✋ MANUAL CHECKIN
	========================================================== */

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


			// Fetch Redis states
			const redisKeys = await redisClient.keys('user:*');
			const redisMap = new Map<string, any>();

			for (const key of redisKeys) {
				const raw = await redisClient.get(key);
				if (!raw) continue;

				const state = JSON.parse(raw);
				const userId = key.replace('user:', '');

				redisMap.set(userId, {
					userId,
					...state,
					latitude: state.currentLat,
					longitude: state.currentLng,
					status: state.status,
					recordedAt: state.lastIntervalTime
						? new Date(state.lastIntervalTime)
						: new Date(),
					source: 'redis',
				});
			}



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