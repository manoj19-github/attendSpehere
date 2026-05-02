import { QueryTypes, Transaction } from 'sequelize';
import { UtilsMain } from '../utils';
import { DEFAULT_PAGE_SIZE } from '../utils/constants.util';
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
		latitude: number;
		longitude: number;
		distance: number;
	}, transaction?: any) {
		return await executeQuery({
			query: `
      INSERT INTO attendance (
        id,
        user_id,
        event_date,
        event_type,
        timestamp_event,
        latitude,
        longitude,
        distance
      )
      VALUES (
        gen_random_uuid(),
        :userId,
        :eventDate,
        :eventType,
        :timestampEvent,
        :latitude,
        :longitude,
        :distance
      )
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

		return await executeQuery<any[]>({
			query: `
        SELECT id, event_type, timestamp_event, created_at
        FROM attendance
        WHERE user_id = :userId  AND   event_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
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
        WHERE user_id = :userId  AND event_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date AND event_type = 'checkin'
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
		return await executeQuery<any[]>({
			query: `
        SELECT event_type, timestamp_event FROM attendance
        WHERE user_id = :userId  AND event_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
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
		return await executeQuery<any[]>({
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
	static async findByDateRange({
		userId,
		startDate,
		endDate
	}: {
		userId?: string; // optional
		startDate: string;
		endDate: string;
	}) {
		const start = new Date(startDate);
		const end = new Date(endDate);

		const startIST = UtilsMain.getDateInIST(start);
		const endIST = UtilsMain.getDateInIST(end);

		return await executeQuery<any[]>({
			query: `
      SELECT
        a.id,
        a.user_id,
        u.full_name,
        u.email,
        a.event_date,
        a.event_type,
        a.timestamp_event,
        a.created_at
      FROM attendance a
      JOIN users u ON u.id = a.user_id
      WHERE
        (:userId IS NULL OR a.user_id = :userId)
        AND a.event_date BETWEEN :startIST AND :endIST
      ORDER BY a.event_date DESC, a.timestamp_event DESC
    `,
			replacements: {
				userId: userId || null,
				startIST,
				endIST
			},
			type: QueryTypes.SELECT
		});
	}

	/**
	 * Query VIEW for working hours
	 */
	static async getWorkingHoursByUser(userId: string, startDate: string, endDate: string) {

		const start = new Date(startDate);
		const end = new Date(endDate);

		const startIST = UtilsMain.getDateInIST(start);
		const endIST = UtilsMain.getDateInIST(end);
		return await executeQuery<any[]>({
			query: `
        SELECT user_id, full_name, event_date, working_hours
        FROM user_daily_working_hours
        WHERE user_id = :userId AND event_date BETWEEN :startIST AND :endIST
        ORDER BY event_date DESC
      `,
			replacements: { userId, startIST, endIST },
			type: QueryTypes.SELECT
		});
	}

	/**
	 * All users working hours (admin)
	 */
	static async getAllWorkingHours(startDate: string, endDate: string) {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const startIST = UtilsMain.getDateInIST(start);
		const endIST = UtilsMain.getDateInIST(end);
		return await executeQuery<any[]>({
			query: `
        SELECT user_id, full_name, event_date, working_hours
        FROM user_daily_working_hours
        WHERE event_date BETWEEN :startIST AND :endIST
        ORDER BY event_date DESC, full_name ASC
      `,
			replacements: { startIST, endIST },
			type: QueryTypes.SELECT
		});
	}
	static async paginatatedAttandanceQueryOfUsers({
		page,
		limit,
		search,
		hoursFilter,
		transaction
	}: {
		page: number;
		limit: number;
		search?: string;
		hoursFilter?: 'below_8' | 'above_8';
		transaction?: Transaction;
	}) {

		const offset = (page - 1) * limit;
		const pagelimit = Number(limit) || DEFAULT_PAGE_SIZE;

		const baseQuery = `
WITH events AS (
    SELECT
        a.id,
        a.user_id,
        a.event_date,
        a.event_type,
        a.timestamp_event
    FROM attendance a
    WHERE a.event_type IN ('checkin', 'checkout')
),

ordered AS (
    SELECT
        e.*,
        SUM(CASE WHEN e.event_type = 'checkin' THEN 1 ELSE 0 END)
        OVER (PARTITION BY e.user_id, e.event_date ORDER BY e.timestamp_event) AS session_id
    FROM events e
),

sessions AS (
    SELECT
        o.user_id,
        o.event_date,
        o.session_id,
        MIN(CASE WHEN o.event_type = 'checkin' THEN o.timestamp_event END) AS checkin_time,
        MAX(CASE WHEN o.event_type = 'checkout' THEN o.timestamp_event END) AS checkout_time
    FROM ordered o
    GROUP BY o.user_id, o.event_date, o.session_id
),

calculated AS (
    SELECT
        s.user_id,
        s.event_date,
        EXTRACT(EPOCH FROM (s.checkout_time - s.checkin_time)) / 3600 AS hours
    FROM sessions s
    WHERE s.checkin_time IS NOT NULL
      AND s.checkout_time IS NOT NULL
),

daily_hours AS (
    SELECT
        user_id,
        event_date,
        ROUND(SUM(hours), 2) AS working_hours
    FROM calculated
    GROUP BY user_id, event_date
),

flags AS (
    SELECT
        a.user_id,
        a.event_date,
        BOOL_OR(a.event_type = 'checkin') AS has_checkin,
        BOOL_OR(a.event_type = 'checkout') AS has_checkout
    FROM attendance a
    GROUP BY a.user_id, a.event_date
),

final_data AS (
    SELECT
        u.id AS user_id,
        u.full_name,
        u.email,
        f.event_date,
        COALESCE(dh.working_hours, 0) AS working_hours,
        f.has_checkin,
        f.has_checkout
    FROM flags f
    JOIN users u ON u.id = f.user_id
    LEFT JOIN daily_hours dh
        ON dh.user_id = f.user_id
       AND dh.event_date = f.event_date
)

SELECT *
FROM final_data
WHERE 1=1

AND (
    :search IS NULL OR
    LOWER(full_name) LIKE LOWER(CONCAT('%', :search, '%')) OR
    LOWER(email) LIKE LOWER(CONCAT('%', :search, '%')) OR
    CAST(event_date AS TEXT) LIKE CONCAT('%', :search, '%')
)

AND (
    :hoursFilter IS NULL OR
    (:hoursFilter = 'below_8' AND working_hours < 8) OR
    (:hoursFilter = 'above_8' AND working_hours >= 8)
)
`;

		// ✅ Data query
		const dataQuery = `
    ${baseQuery}
    ORDER BY event_date DESC
    LIMIT :limit OFFSET :offset
  `;

		// ✅ Count query
		const countQuery = `
    SELECT COUNT(*) as total FROM (
      ${baseQuery}
    ) AS count_query
  `;

		const replacements = {
			limit: pagelimit,
			offset,
			search: search?.trim() || null,
			hoursFilter: hoursFilter || null,
		};

		// 🔥 Execute both
		const [data, countResult] = await Promise.all([
			executeQuery<any[]>({
				query: dataQuery,
				replacements,
				type: QueryTypes.SELECT,
				transaction
			}),
			executeQuery<any[]>({
				query: countQuery,
				replacements,
				type: QueryTypes.SELECT,
				transaction
			})
		]);

		const total = parseInt(countResult?.[0]?.total || '0');

		return {
			data,
			pagination: {
				total,
				page,
				limit: pagelimit,
				totalPages: Math.ceil(total / pagelimit),
			}
		};
	}
}