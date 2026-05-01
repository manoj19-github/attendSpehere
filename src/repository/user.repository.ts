import { QueryTypes, Transaction } from 'sequelize';
import { executeQuery } from '../utils/executeQuery.util';

export class UserRepository {
	static async create(data: { fullName: string; email: string; password: string; role: string }, transaction?: any) {
		return executeQuery({
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
		return executeQuery<any[]>({
			query: `SELECT * FROM users WHERE email = :email LIMIT 1`,
			replacements: { email },
			type: QueryTypes.SELECT,
			transaction
		});
	}

	static async findById(id: string) {
		return executeQuery<any[]>({
			query: `SELECT id, full_name, email, role, created_at FROM users WHERE id = :id LIMIT 1`,
			replacements: { id },
			type: QueryTypes.SELECT
		});
	}

	static async findAll(limit: number, offset: number) {
		return executeQuery<any[]>({
			query: `
        SELECT id, full_name, email, role, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
      `,
			replacements: { limit, offset },
			type: QueryTypes.SELECT
		});
	}

	static async countAll() {
		return executeQuery<{ count: string }[]>({
			query: `SELECT COUNT(*) as count FROM users`,
			type: QueryTypes.SELECT
		});
	}
}