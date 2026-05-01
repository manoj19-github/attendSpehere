import { NextFunction, Request, Response } from 'express';
import { Transaction } from 'sequelize';
import { sequelize } from '../../config/dbConfig';
import { AuthService } from '../services/auth.service';

export class AuthController {
	static async register(req: Request, res: Response, next: NextFunction) {
		let transaction: Transaction | undefined;
		try {
			transaction = await sequelize.transaction();
			const { fullName, email, password, role, fingerPrint, androidId, deviceModel, osVersion } = req.body;
			console.log('fingerPrint: ', fingerPrint);
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
			console.log('error: ', error);
			transaction?.rollback();
			next(error);
		}
	}

	static async getUserFromToken(req: Request, res: Response, next: NextFunction) {
		try {
			const user = (req as any).user;
			console.log('user: ', user);

			if (!user) {
				return res.status(401).json({
					success: false,
					message: 'Invalid token'
				});
			}

			return res.status(200).json({
				success: true,
				data: {
					user,
					token: req.headers.authorization?.split(' ')[1]
				}
			});
		} catch (error) {
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


			console.log("req.body: ", req.body);

			const result = await AuthService.login(email, password, androidId, fingerPrint, transaction);
			transaction.commit();
			return res.status(200).json({ success: true, data: result });
		} catch (error: any) {
			console.log('error: ', error?.message);
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