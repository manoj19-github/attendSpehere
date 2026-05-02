import { QueryTypes } from 'sequelize';
import { executeQuery } from '../utils/executeQuery.util';

export class OfficeSettingsRepository {

	/**
	 * Get full office config (all columns)
	 */
	static async getConfig(transaction?: any) {
		return await executeQuery<any>({
			query: `
        SELECT
  id,
  name,
  lat,
  lng,
  radius,
  office_address,
  distance_threshold,
  time_interval_ms,
  polling_interval,
  working_start,
  working_end,
  working_days,
  created_at,
  updated_at
FROM office_settings
LIMIT 1
      `,
			type: QueryTypes.SELECT,
			transaction
		});
	}

	/**
	 * Get only location config
	 */
	static async getLocation(transaction?: any) {
		return await executeQuery<any>({
			query: `
        SELECT
          lat,
          lng,
          radius
        FROM office_settings
        LIMIT 1
      `,
			type: QueryTypes.SELECT
		});
	}

	/**
	 * Get working hours config
	 */
	static async getWorkingHours(transaction?: any) {
		return await executeQuery<any>({
			query: `
        SELECT
          working_start,
          working_end,
          working_days
        FROM office_settings
        LIMIT 1
      `,
			type: QueryTypes.SELECT,
			transaction
		});
	}

	/**
	 * Get polling interval
	 */
	static async getPollingInterval(transaction?: any) {
		return await executeQuery<any>({
			query: `
        SELECT
          polling_interval
        FROM office_settings
        LIMIT 1
      `,
			type: QueryTypes.SELECT,
			transaction
		});
	}

	/**
	 * Update full config
	 */
	static async updateConfig(data: {
		name: string;
		lat: number;
		lng: number;
		radius: number;
		pollingInterval: number;
		workingStart: number;
		workingEnd: number;
		workingDays: number[];
		officeAddress: string;
		distanceThreshold: number;
		timeIntervalMs: number;
	}, transaction?: any) {
		return await executeQuery({
			query: `
      UPDATE office_settings
      SET
        name = :name,
        lat = :lat,
        lng = :lng,
        radius = :radius,
        office_address = :officeAddress,
        distance_threshold = :distanceThreshold,
        time_interval_ms = :timeIntervalMs,
        polling_interval = :pollingInterval,
        working_start = :workingStart,
        working_end = :workingEnd,
        working_days = :workingDays::jsonb,
        updated_at = CURRENT_TIMESTAMP
    `,
			replacements: {
				...data,
				workingDays: JSON.stringify(data.workingDays),
			},
			type: QueryTypes.UPDATE,
			transaction
		});
	}


	/**
	 * Update only location (lat/lng/radius)
	 */
	static async updateLocation(data: {
		lat: number;
		lng: number;
		radius: number;
	}, transaction?: any) {
		return await executeQuery({
			query: `
        UPDATE office_settings
        SET
          lat = :lat,
          lng = :lng,
          radius = :radius,
          updated_at = CURRENT_TIMESTAMP
      `,
			replacements: data,
			type: QueryTypes.UPDATE,
			transaction
		});
	}

	/**
	 * Update working hours only
	 */
	static async updateWorkingHours(data: {
		workingStart: number;
		workingEnd: number;
		workingDays: number[];

	}, transaction?: any) {
		return await executeQuery({
			query: `
        UPDATE office_settings
        SET
          working_start = :workingStart,
          working_end = :workingEnd,
          working_days = :workingDays::jsonb,
          updated_at = CURRENT_TIMESTAMP
      `,
			replacements: {
				...data,
				workingDays: JSON.stringify(data.workingDays),
			},
			type: QueryTypes.UPDATE,
			transaction
		});
	}
}