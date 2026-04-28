import { QueryTypes } from 'sequelize';
import { executeQuery } from '../utils/executeQuery.util';

export class AttendanceRepository {
	/**
	 * Insert a single attendance event (checkin or checkout).
	 * Event-based design: each checkin/checkout is its own row.
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
	 * Fetch raw attendance events for a user (paginated).
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
	 * Fetch raw attendance events within a date range.
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
	 * Query the VIEW for daily working hours of a specific user.
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
	 * Query the VIEW for daily working hours of ALL users (admin MIS).
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