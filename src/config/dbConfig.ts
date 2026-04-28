import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

export const sequelize = new Sequelize(
	process.env.DB_NAME || 'attendance_db',
	process.env.DB_USER || 'postgres',
	process.env.DB_PASSWORD || 'password',
	{
		host: process.env.DB_HOST || 'localhost',
		port: parseInt(process.env.DB_PORT || '5432'),
		dialect: 'postgres',
		logging: false,
		pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
	}
);


const connectDB = async (): Promise<void> => {
	try {
		await sequelize.authenticate();
		console.log(`✅ PostgreSQL connected`);
	} catch (error) {
		console.error('❌ Database connection failed:', error);
		process.exit(1);
	}
};
export default connectDB;
