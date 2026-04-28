import { QueryTypes } from 'sequelize';
import { executeQuery } from '../utils/executeQuery.util';

export class AttendanceRepository {
	/**
	 * Insert attendance event (checkin or checkout)
	 */
	static async insertEvent(data: {
		userId: string;
		eventDate: string;
		eventType: 'checkin' | 'checkout';
		timestampEvent: Date;
	}, transaction?: any) {
		return executeQuery({
			query: `
        INSERT INTO attendance (id, user_id, event_date, event_type, timestamp_event)
        VALUES (gen_random_uuid(), :userId, :eventDate, :eventType, :timestampEvent)
      `,
			replacements: data,
			type: QueryTypes.INSERT,
			transaction
		});
	}

	/**
	 * Get today's events for a user
	 */
	static async getTodayEvents(userId: string) {
		return executeQuery<any[]>({
			query: `
        SELECT id, event_type, timestamp_event, created_at
        FROM attendance
        WHERE user_id = :userId AND event_date = CURRENT_DATE
        ORDER BY timestamp_event ASC
      `,
			replacements: { userId },
			type: QueryTypes.SELECT
		});
	}

	/**
	 * Check if user has any checkin today
	 */
	static async hasCheckinToday(userId: string) {
		const result = await executeQuery<any[]>({
			query: `
        SELECT COUNT(*) as count FROM attendance
        WHERE user_id = :userId AND event_date = CURRENT_DATE AND event_type = 'checkin'
      `,
			replacements: { userId },
			type: QueryTypes.SELECT
		});
		return parseInt(result[0]?.count || '0') > 0;
	}

	/**
	 * Get last event of today
	 */
	static async getLastEventToday(userId: string) {
		return executeQuery<any[]>({
			query: `
        SELECT event_type, timestamp_event FROM attendance
        WHERE user_id = :userId AND event_date = CURRENT_DATE
        ORDER BY timestamp_event DESC LIMIT 1
      `,
			replacements: { userId },
			type: QueryTypes.SELECT
		});
	}

	/**
	 * Paginated history
	 */
	static async findByUserId(userId: string, limit: number, offset: number) {
		return executeQuery<any[]>({
			query: `
        SELECT id, event_date, event_type, timestamp_event, created_at
        FROM attendance
        WHERE user_id = :userId
        ORDER BY event_date DESC, timestamp_event DESC
        LIMIT :limit OFFSET :offset
      `,
			replacements: { userId, limit, offset },
			type: QueryTypes.SELECT
		});
	}

	/**
	 * Date range query
	 */
	static async findByDateRange(userId: string, startDate: string, endDate: string) {
		return executeQuery<any[]>({
			query: `
        SELECT id, event_date, event_type, timestamp_event, created_at
        FROM attendance
        WHERE user_id = :userId AND event_date BETWEEN :startDate AND :endDate
        ORDER BY event_date DESC, timestamp_event DESC
      `,
			replacements: { userId, startDate, endDate },
			type: QueryTypes.SELECT
		});
	}

	/**
	 * Query VIEW for working hours
	 */
	static async getWorkingHoursByUser(userId: string, startDate: string, endDate: string) {
		return executeQuery<any[]>({
			query: `
        SELECT user_id, full_name, event_date, working_hours
        FROM user_daily_working_hours
        WHERE user_id = :userId AND event_date BETWEEN :startDate AND :endDate
        ORDER BY event_date DESC
      `,
			replacements: { userId, startDate, endDate },
			type: QueryTypes.SELECT
		});
	}

	/**
	 * All users working hours (admin)
	 */
	static async getAllWorkingHours(startDate: string, endDate: string) {
		return executeQuery<any[]>({
			query: `
        SELECT user_id, full_name, event_date, working_hours
        FROM user_daily_working_hours
        WHERE event_date BETWEEN :startDate AND :endDate
        ORDER BY event_date DESC, full_name ASC
      `,
			replacements: { startDate, endDate },
			type: QueryTypes.SELECT
		});
	}
}