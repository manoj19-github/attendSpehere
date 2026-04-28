import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
	static async register(req: Request, res: Response, next: NextFunction) {
		try {
			const { fullName, email, password, role } = req.body;
			if (!fullName || !email || !password) {
				return res.status(400).json({
					success: false,
					message: 'fullName, email, and password are required'
				});
			}

			await AuthService.register(fullName, email, password, role);
			return res.status(201).json({
				success: true,
				message: 'User registered successfully'
			});
		} catch (error) {
			next(error);
		}
	}

	static async login(req: Request, res: Response, next: NextFunction) {
		try {
			const { email, password, androidId, fingerprint } = req.body;

			if (!email || !androidId) {
				return res.status(400).json({
					success: false,
					message: 'email and androidId are required'
				});
			}

			// At least one auth method required
			if (!password && !fingerprint) {
				return res.status(400).json({
					success: false,
					message: 'password or fingerprint is required'
				});
			}

			const result = await AuthService.login(email, password, androidId, fingerprint);
			return res.status(200).json({ success: true, data: result });
		} catch (error: any) {
			if (error.message.includes('registered') || error.message.includes('verification')) {
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