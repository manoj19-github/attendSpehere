import { QueryTypes, Transaction } from 'sequelize';
import { executeQuery } from '../utils/executeQuery.util';

export class UserRepository {
	static async create(data: { fullName: string; email: string; password: string; role: string }, transaction?: any) {
		return await executeQuery({
			query: `
        INSERT INTO users (id, full_name, email, password, role)
        VALUES (gen_random_uuid(), :fullName, :email, :password, :role)
        RETURNING id, full_name, email, role, created_at
      `,
			replacements: data,
			type: QueryTypes.INSERT,
			transaction
		});
	}

	static async findByEmail(email: string, transaction?: Transaction) {
		return await executeQuery<any[]>({
			query: `SELECT * FROM users WHERE email = :email LIMIT 1`,
			replacements: { email },
			type: QueryTypes.SELECT,
			transaction
		});
	}

	static async findById(id: string) {
		return await executeQuery<any[]>({
			query: `SELECT id, full_name, email, role, created_at FROM users WHERE id = :id LIMIT 1`,
			replacements: { id },
			type: QueryTypes.SELECT
		});
	}

	static async findAllBasic(
		{ page = 1, limit = 10, search, transaction }:
			{
				page: number;
				limit: number;
				search?: string,
				transaction?: Transaction
			}
	) {
		const offset = (page - 1) * limit;

		// 🔍 Search condition
		const searchCondition = search
			? ` AND  (u.full_name ILIKE :search OR u.email ILIKE :search)`
			: '';


		const query = `
  SELECT
    u.id,
    u.full_name,
    u.email,
    u.role,
    u.created_at,

    EXISTS (
      SELECT 1
      FROM attendance a
      WHERE a.user_id = u.id
        AND a.event_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
        AND a.event_type = 'checkin'
    ) AS is_present

  FROM users u

	WHERE u.role != 'admin'

  ${searchCondition}

  ORDER BY u.created_at DESC
  LIMIT :limit OFFSET :offset

  `;

		const countQuery = `
    SELECT COUNT(*) as total
    FROM users u
		WHERE u.role != 'admin'
    ${searchCondition}
  `;

		const replacements: any = {
			limit,
			offset,
		};

		if (search) {
			replacements.search = `%${search}%`; // 🔥 partial match
		}

		const data = await executeQuery<any[]>({
			query, replacements,
			type: QueryTypes.SELECT,
			transaction
		});

		const countResult: any = await executeQuery<any[]>({
			query: countQuery,
			replacements,
			type: QueryTypes.SELECT,
			transaction,
		});

		const total = Number(countResult[0].total);

		return {
			data,
			pagination: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	static async countAll() {
		return await executeQuery<{ count: string }[]>({
			query: `SELECT COUNT(*) as count FROM users`,
			type: QueryTypes.SELECT
		});
	}
}