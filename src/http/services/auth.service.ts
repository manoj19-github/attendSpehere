import bcrypt from 'bcrypt';
import { redisClient } from '../../config/redis.config';
import { DeviceRepository } from '../../repository/device.repository';
import { UserRepository } from '../../repository/user.repository';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.util';


export class AuthService {
	static async register(fullName: string, email: string, password: string, role: string = 'employee') {
		const existing = await UserRepository.findByEmail(email);
		if (existing.length > 0) throw new Error('Email already registered');

		const hashedPassword = await bcrypt.hash(password, 10);
		return UserRepository.create({ fullName, email, password: hashedPassword, role });
	}

	/**
	 * Login supports password OR fingerprint
	 * Device must be registered first
	 */
	static async login(email: string, password: string | undefined, androidId: string, fingerprint: string | undefined) {
		const users = await UserRepository.findByEmail(email);
		if (users.length === 0) throw new Error('Invalid credentials');

		const user = users[0];

		// Verify password if provided, else verify fingerprint
		if (password) {
			const validPassword = await bcrypt.compare(password, user.password);
			if (!validPassword) throw new Error('Invalid credentials');
		} else if (fingerprint) {
			// Fingerprint-based login: verify against stored device fingerprint
			const devices = await DeviceRepository.findByUserId(user.id);
			if (devices.length === 0 || devices[0].fingerprint !== fingerprint) {
				throw new Error('Fingerprint verification failed');
			}
		} else {
			throw new Error('Password or fingerprint required');
		}

		// Device verification
		const devices = await DeviceRepository.findByUserId(user.id);
		if (devices.length === 0) throw new Error('Device not registered. Please register your device first.');

		const device = devices[0];
		if (device.android_id !== androidId) {
			throw new Error('Device verification failed - Android ID mismatch');
		}

		const accessToken = generateAccessToken({ userId: user.id, role: user.role });
		const refreshToken = generateRefreshToken({ userId: user.id });

		await redisClient.setex(`refresh:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

		return {
			user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role },
			accessToken,
			refreshToken
		};
	}

	static async refreshToken(token: string) {
		const decoded = verifyRefreshToken(token) as { userId: string };
		const stored = await redisClient.get(`refresh:${decoded.userId}`);
		if (!stored || stored !== token) throw new Error('Invalid refresh token');

		const users = await UserRepository.findById(decoded.userId);
		if (users.length === 0) throw new Error('User not found');

		const accessToken = generateAccessToken({ userId: users[0].id, role: users[0].role });
		return { accessToken };
	}
}