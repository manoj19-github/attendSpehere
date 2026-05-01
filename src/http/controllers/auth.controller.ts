import { NextFunction, Request, Response } from 'express';
import { Transaction } from 'sequelize';
import { sequelize } from '../../config/dbConfig';
import { logger } from '../../utils/logger';
import { AuthService } from '../services/auth.service';
import { LocationService } from '../services/location.service';
import { OfficeSettingsService } from '../services/officeSettings.service';

export class AuthController {
	static async register(req: Request, res: Response, next: NextFunction) {
		let transaction: Transaction | undefined;
		try {
			transaction = await sequelize.transaction();
			const { fullName, email, password, role, fingerPrint, androidId, deviceModel, osVersion } = req.body;
			logger.info('fingerPrint: ', fingerPrint);
			if (!fullName || !email || !password) {
				return res.status(400).json({
					success: false,
					message: 'fullName, email, and password are required'
				});
			}

			await AuthService.register({ fullName, email, password, role, fingerPrint, androidId, deviceModel, osVersion }, transaction);
			transaction.commit();
			return res.status(201).json({
				success: true,
				message: 'User registered successfully'
			});
		} catch (error) {
			logger.info('error: ', error);
			transaction?.rollback();
			next(error);
		}
	}

	static async getUserFromToken(req: Request, res: Response, next: NextFunction) {
		let transaction: Transaction | undefined;
		try {
			transaction = await sequelize.transaction();

			const user = (req as any).user;
			logger.info('user: ', user);
			if (user?.userId)
				await LocationService.cleanOldKeys(user.userId);


			if (!user) {
				return res.status(401).json({
					success: false,
					message: 'Invalid token'
				});
			}
			const officeSettings = await OfficeSettingsService.getConfig(transaction);
			transaction.commit();

			return res.status(200).json({
				success: true,
				data: {
					user,
					officeSettings,
					token: req.headers.authorization?.split(' ')[1]
				}
			});
		} catch (error) {
			transaction?.rollback();
			next(error);
		}
	}

	static async login(req: Request, res: Response, next: NextFunction) {
		let transaction: Transaction | undefined;
		try {
			transaction = await sequelize.transaction();
			const { email, password, androidId, fingerPrint } = req.body;

			if (!email || !androidId) {
				return res.status(400).json({
					success: false,
					message: 'email and androidId are required'
				});
			}

			// At least one auth method required
			if (!password && !fingerPrint) {
				return res.status(400).json({
					success: false,
					message: 'password or fingerprint is required'
				});
			}


			logger.info("req.body: ", req.body);

			const result = await AuthService.login(email, password, androidId, fingerPrint, transaction);
			transaction.commit();
			return res.status(200).json({ success: true, data: result });
		} catch (error: any) {
			logger.info('error: ', error?.message);
			transaction?.rollback();
			if (error.message.includes('registered') || error.message.includes('verification') || error.message.includes('Invalid credentials')) {
				return res.status(401).json({ success: false, message: error.message });
			}
			next(error);
		}
	}

	static async refreshToken(req: Request, res: Response, next: NextFunction) {
		try {
			const { refreshToken } = req.body;
			if (!refreshToken) {
				return res.status(400).json({
					success: false,
					message: 'refreshToken is required'
				});
			}

			const result = await AuthService.refreshToken(refreshToken);
			return res.status(200).json({ success: true, data: result });
		} catch (error) {
			next(error);
		}
	}
}