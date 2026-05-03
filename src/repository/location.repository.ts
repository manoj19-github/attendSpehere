import { QueryTypes, Transaction } from 'sequelize';
import { sequelize } from '../config/dbConfig';
import { UtilsMain } from '../utils';
import { executeQuery } from '../utils/executeQuery.util';

export class LocationRepository {
	static async create(data: {
		userId: string; latitude: number; longitude: number;
		isInside: boolean; distance: number | null;
		recordedAt: Date; logType?: string;
	}, transaction?: any) {
		return await executeQuery({
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


	static async getLastAttendanceEvent(userId: string, transaction?: any) {
		const result: any = await executeQuery({
			query:
				`
    SELECT event_type
    FROM attendance
    WHERE user_id = :userId
    ORDER BY timestamp_event DESC
    LIMIT 1
    `,
			replacements: { userId },
			type: QueryTypes.INSERT,
			transaction
		}
		);

		return result?.[0]?.event_type || null;
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

		console.log("startDate, endDate >>>> ", {
			startIST,
			endIST,
			offset,
			limit,
			search,
			userId,
		});

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
    WHERE l.recorded_at >= :startDate
  AND l.recorded_at <  :endDate
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
     and l.recorded_at >= :startDate
  AND l.recorded_at <  :endDate
    ORDER BY l.recorded_at DESC
    LIMIT :limit OFFSET :offset
  `;

		const countQuery = `
    SELECT COUNT(*) as total
    FROM locations l
      WHERE l.recorded_at >= :startDate
  AND l.recorded_at <  :endDate
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
			console.log("query >>>> ", query);
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

		console.log("countResult >>> ", countResult);

		const total = userId ? null : Number(countResult?.[0]?.total || 0);

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