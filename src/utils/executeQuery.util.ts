
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/dbConfig';

interface ExecuteQueryOptions {
	query: string;
	replacements?: Record<string, any>;
	type: QueryTypes;
	transaction?: any;
}

export const executeQuery = async <T>(options: ExecuteQueryOptions): Promise<T> => {
	const result = await sequelize.query(options.query, {
		replacements: options.replacements,
		type: options.type,
		transaction: options.transaction
	});
	return result as unknown as T;
};
