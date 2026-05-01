import { QueryTypes } from 'sequelize';
import { UtilsMain } from '../utils';
import { executeQuery } from '../utils/executeQuery.util';

export class LocationRepository {
	static async create(data: {
		userId: string; latitude: number; longitude: number;
		isInside: boolean; distance: number | null;
		recordedAt: Date; logType?: string;
	}, transaction?: any) {
		return executeQuery({
			query: `
        INSERT INTO locations
          (id, user_id, latitude, longitude, is_inside, distance, recorded_at, log_type)
        VALUES
          (gen_random_uuid(), :userId, :latitude, :longitude, :isInside, :distance, :recordedAt, :logType)
      `,
			replacements: {
				userId: data.userId, latitude: data.latitude, longitude: data.longitude,
				isInside: data.isInside, distance: data.distance,
				recordedAt: data.recordedAt, logType: data.logType || null
			},
			type: QueryTypes.INSERT,
			transaction
		});
	}

	static async findByUserId(userId: string, limit: number, offset: number) {
		return executeQuery<any[]>({
			query: `
        SELECT id, latitude, longitude, is_inside, distance, recorded_at, log_type, created_at
        FROM locations WHERE user_id = :userId
        ORDER BY recorded_at DESC LIMIT :limit OFFSET :offset
      `,
			replacements: { userId, limit, offset },
			type: QueryTypes.SELECT
		});
	}

	static async findByUserIdAndDateRange(userId: string, startDate: string, endDate: string) {

		const start = new Date(startDate);
		const end = new Date(endDate);

		const startIST = UtilsMain.getDateInIST(start);
		const endIST = UtilsMain.getDateInIST(end);

		return executeQuery<any[]>({
			query: `
        SELECT id, latitude, longitude, is_inside, distance, recorded_at, log_type, created_at
        FROM locations
        WHERE user_id = :userId AND recorded_at BETWEEN :startDate AND :endDate
        ORDER BY recorded_at DESC
      `,
			replacements: { userId, startIST, endIST },
			type: QueryTypes.SELECT
		});
	}
}