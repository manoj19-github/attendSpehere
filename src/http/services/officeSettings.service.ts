// officeSettings.service.ts

import { redisClient } from '../../config/redis.config';
import { OfficeSettingsRepository } from '../../repository/officeSettings.repository';
import { OfficeConfig, WorkingHours } from '../../types';
import { OFFICE_CONFIG_KEY } from '../../utils/constants.util';
import { logger } from '../../utils/logger';
import { HttpException } from '../exceptions/http.exceptions';


export class OfficeSettingsService {


	static async getConfig(transaction?: any): Promise<OfficeConfig> {
		const cachedRedisConfig = await redisClient.get(OFFICE_CONFIG_KEY);
		console.log('cachedRedisConfig: ', cachedRedisConfig);
		let result: any;

		if (cachedRedisConfig) {
			result = JSON.parse(cachedRedisConfig);
			logger.info('result: ', result);
		} else {
			result = await OfficeSettingsRepository.getConfig(transaction);
			if (result?.length === 0) {
				throw new HttpException(400, 'Office configuration not found');
			}
			await redisClient.set(OFFICE_CONFIG_KEY, JSON.stringify(result));
		}




		const office = Array.isArray(result) && result.length > 0 ?
			JSON.parse(JSON.stringify(result[0])) :
			result ? JSON.parse(JSON.stringify(result)) : null;


		logger.info("office >>> ", office);

		if (!office) {
			throw new HttpException(400, 'Office configuration not found');
		}

		return {
			OFFICE_LAT: office.lat,
			OFFICE_LNG: office.lng,
			OFFICE_RADIUS: office.radius,
			OFFICE_NAME: office.name,
			OFFICE_ADDRESS: office.office_address,

			LOCATION_POLLING_INTERVAL: office.polling_interval,

			DISTANCE_THRESHOLD: office.distance_threshold,
			TIME_INTERVAL_MS: office.time_interval_ms,

			WORKING_HOURS: {
				start: office.working_start,
				end: office.working_end,
				days: office.working_days || [],
			},
		};
	}

	/**
	 * Get only working hours (your requested format)
	 */
	static async getWorkingHours(transaction?: any): Promise<WorkingHours> {
		const result = await OfficeSettingsRepository.getWorkingHours(transaction);


		const data = result?.[0];

		if (!data) {
			throw new HttpException(400, 'Working hours not found');
		}

		return {
			start: data.working_start,
			end: data.working_end,
			days: data.working_days || [],
		};
	}

	/**
	 * Update full config
	 */
	static async updateConfig(payload: OfficeConfig, transaction?: any) {
		await OfficeSettingsRepository.updateConfig({
			name: payload.OFFICE_NAME,
			lat: payload.OFFICE_LAT,
			lng: payload.OFFICE_LNG,
			radius: payload.OFFICE_RADIUS,
			pollingInterval: payload.LOCATION_POLLING_INTERVAL,
			workingStart: payload.WORKING_HOURS.start,
			workingEnd: payload.WORKING_HOURS.end,
			workingDays: payload.WORKING_HOURS.days,
			officeAddress: payload.OFFICE_ADDRESS,
			distanceThreshold: payload.DISTANCE_THRESHOLD,
			timeIntervalMs: payload.TIME_INTERVAL_MS,
		}, transaction);

		await redisClient.del(OFFICE_CONFIG_KEY);  // clear completely from Redis

		return await OfficeSettingsService.getConfig(transaction);
	}

	/**
	 * Update only working hours
	 */

}