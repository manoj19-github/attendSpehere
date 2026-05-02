import { sequelize } from '@/config/dbConfig';
import { QueryTypes, Transaction } from 'sequelize';
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








	static async findLocationByDateRange({
		startDate,
		endDate,
		page = 1,
		limit = 10,
		search,
		userId,
		transaction
	}: {
		userId?: string;
		startDate: string;
		endDate: string;
		page: number;
		search?: string;
		limit: number;
		transaction?: Transaction
	}
	) {
		const offset = (page - 1) * limit;
		const start = new Date(startDate);
		const end = new Date(endDate);
		end.setHours(23, 59, 59, 999);

		const startIST = UtilsMain.getDateInIST(start);
		const endIST = UtilsMain.getDateInIST(end);

		const searchCondition = search
			? `   AND (l.user_id = :userId AND (l.full_name ILIKE :search OR l.email ILIKE :search)) `
			: '';

		const query = `
    SELECT
      l.id,
      l.user_id,
      u.full_name,
      u.email,
      l.latitude,
      l.longitude,
      l.is_inside,
      l.distance,
      l.recorded_at,
      l.log_type,
      l.created_at
    FROM locations l
    INNER JOIN users u ON u.id = l.user_id
    WHERE l.recorded_at BETWEEN :startDate AND :endDate
		${searchCondition}
    ORDER BY l.recorded_at DESC
    LIMIT :limit OFFSET :offset
  `;

		const byUserIdQueryQuery = `
    SELECT
      l.id,
      l.user_id,
      u.full_name,
      u.email,
      l.latitude,
      l.longitude,
      l.is_inside,
      l.distance,
      l.recorded_at,
      l.log_type,
      l.created_at
    FROM locations l
    INNER JOIN users u ON u.id = l.user_id
    WHERE l.user_id = :userId
    AND l.recorded_at BETWEEN :startDate AND :endDate
    ORDER BY l.recorded_at DESC
    LIMIT :limit OFFSET :offset
  `;

		const countQuery = `
    SELECT COUNT(*) as total
    FROM locations l
    WHERE l.recorded_at BETWEEN :startDate AND :endDate
		${searchCondition}
  `;

		const replacements = {
			startDate: startIST,
			endDate: endIST,
			limit,
			offset,
			userId
		};

		let rows: any = null;
		if (userId) {
			rows = await sequelize.query(byUserIdQueryQuery, {
				replacements,
				type: QueryTypes.SELECT,
				transaction,
			});
		} else {
			rows = await sequelize.query(query, {
				replacements,
				type: QueryTypes.SELECT,
				transaction,
			});
		}




		let countResult: any = null;
		if (userId) {
			countResult = await sequelize.query(countQuery, {
				replacements,
				type: QueryTypes.SELECT,
				transaction,
			});
		}

		const total = userId ? null : Number(countResult[0].total);

		return {
			data: rows,
			pagination: {
				total,
				page,
				limit,

			},
		};
	}
}