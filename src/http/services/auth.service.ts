import bcrypt from 'bcrypt';
import { Transaction } from 'sequelize';
import { redisClient } from '../../config/redis.config';
import { DeviceRepository } from '../../repository/device.repository';
import { UserRepository } from '../../repository/user.repository';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.util';
import { logger } from '../../utils/logger';
import { HttpException } from '../exceptions/http.exceptions';
import { OfficeSettingsService } from './officeSettings.service';


export class AuthService {
	static async register({ fullName, email, password, role, fingerPrint, androidId, deviceModel, osVersion }: {
		fullName: string, email: string, password: string, role: string, fingerPrint: string,
		androidId: string, deviceModel: string, osVersion: string
	}, transaction?: Transaction
	) {
		const existing = await UserRepository.findByEmail(email);
		logger.info('existing: ', existing);
		if (existing.length > 0) throw new HttpException(401, 'Email already registered');
		if (password.length < 8) throw new HttpException(401, 'Password must be at least 8 characters');
		const deviceRegistered = await DeviceRepository.findByFingerPrint(fingerPrint);

		if (deviceRegistered.length > 0) throw new HttpException(401, 'Device already registered');




		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser: unknown = await UserRepository.create({ fullName, email, password: hashedPassword, role }, transaction);
		logger.info('newUser: ', newUser);
		if (Array.isArray(newUser) && newUser.length === 0) throw new HttpException(401, 'User registration failed');
		const userId = Array.isArray(newUser) && Array.isArray(newUser[0]) ? newUser[0][0].id : (newUser as any)?.id;

		return await DeviceRepository.create({ userId: userId, androidId, deviceModel, osVersion, fingerprint: fingerPrint }, transaction);
	}

	/**
	 * Login supports password OR fingerprint
	 * Device must be registered first
	 */
	static async login(email: string, password: string, androidId: string, fingerPrint: string, transaction?: Transaction) {
		const users = await UserRepository.findByEmail(email, transaction);

		if (users.length === 0) throw new HttpException(401, 'Invalid credentials');

		const user = users[0];
		logger.info('user: ', user);

		// Verify password if provided, else verify fingerprint

		const validPassword = await bcrypt.compare(password, user.password);
		if (!validPassword) throw new HttpException(401, 'Invalid credentials');


		const devices = await DeviceRepository.findByUserId(user.id, transaction);
		logger.info('devices: ', devices);
		if (devices.length === 0 || devices[0].fingerprint !== fingerPrint) {
			throw new HttpException(401, 'Device  verification failed');
		}


		// Device verification

		if (devices.length === 0) throw new HttpException(401, 'Device not registered. Please register your device first.');

		const device = devices[0];
		if (device.android_id !== androidId) {
			throw new HttpException(401, 'Device verification failed - Android ID mismatch');
		}

		const accessToken = generateAccessToken({ userId: user.id, role: user.role, fullName: user.full_name, email: user.email });
		const refreshToken = generateRefreshToken({ userId: user.id });
		const officeSettings = await OfficeSettingsService.getConfig(transaction);

		await redisClient.setex(`refresh:${user.id}`, 7 * 24 * 60 * 60, refreshToken);


		return {
			user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role },
			officeSettings,
			accessToken,
			refreshToken
		};
	}

	static async refreshToken(token: string) {
		const decoded = verifyRefreshToken(token) as { userId: string };
		const stored = await redisClient.get(`refresh:${decoded.userId}`);
		if (!stored || stored !== token) throw new HttpException(401, 'Invalid refresh token');

		const users = await UserRepository.findById(decoded.userId);
		if (users.length === 0) throw new HttpException(401, 'User not found');

		const accessToken = generateAccessToken({ userId: users[0].id, role: users[0].role, fullName: users[0].full_name, email: users[0].email });
		return { accessToken };
	}
}