import JWT from 'jsonwebtoken';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
export class AuthUtils {
	static readonly JWT_ACCESS_TOKEN_EXPIRES = '1h'; // 1 hour
	static readonly JWT_REFRESH_TOKEN_EXPIRES = '7d'; // 7 days

	// For numeric expiry calculations in UTC
	static readonly ACCESS_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour in ms
	static readonly REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

	static generateAccessToken(payload: any): string {
		const now = Math.floor(Date.now() / 1000); // Current UTC timestamp in seconds
		const expiresIn = 60 * 60; // 1 hour in seconds


		return JWT.sign(
			{
				...payload,
				tokenType: 'access',
				jti: uuidv4(),
				iat: now, // Issued at (UTC)
				exp: now + expiresIn // Expires at (UTC)
			},
			process.env.JWT_SECRET!
		);
	}

	static generateRefreshToken(payload: any): string {
		const now = Math.floor(Date.now() / 1000); // Current UTC timestamp in seconds
		const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds

		return JWT.sign(
			{
				...payload,
				tokenType: 'refresh',
				jti: uuidv4(),
				iat: now, // Issued at (UTC)
				exp: now + expiresIn // Expires at (UTC)
			},
			process.env.JWT_REFRESH_SECRET!
		);
	}

	static verifyAccessToken(token: string): any {
		return JWT.verify(token, process.env.JWT_SECRET!);
	}

	static verifyRefreshToken(token: string): any {
		return JWT.verify(token, process.env.JWT_REFRESH_SECRET!);
	}

	// Helper to get UTC expiry dates
	static getAccessTokenExpiry(): Date {
		return new Date(Date.now() + this.ACCESS_TOKEN_EXPIRY_MS);
	}

	static getRefreshTokenExpiry(): Date {
		return new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY_MS);
	}

	// Get current UTC timestamp
	static getCurrentUTCDate(): Date {
		return new Date(); // JavaScript Date uses UTC by default
	}

	// Convert UTC timestamp to Date
	static UTCToDate(utcTimestamp: number): Date {
		return new Date(utcTimestamp * 1000); // Convert seconds to milliseconds
	}

	// Check if token is expired using UTC
	static isTokenExpired(decodedToken: any): boolean {
		if (!decodedToken.exp) return true;

		const currentUTC = Math.floor(Date.now() / 1000); // Current UTC in seconds
		return decodedToken.exp < currentUTC;
	}

	// Check if token is about to expire (for proactive refresh)
	static isTokenExpiringSoon(decodedToken: any, thresholdMinutes: number = 5): boolean {
		if (!decodedToken.exp) return true;

		const currentUTC = Math.floor(Date.now() / 1000);
		const expiresIn = decodedToken.exp - currentUTC;
		return expiresIn < thresholdMinutes * 60; // Convert minutes to seconds
	}

	// Get token expiry in UTC Date object
	static getTokenExpiryDate(decodedToken: any): Date | null {
		if (!decodedToken.exp) return null;
		return this.UTCToDate(decodedToken.exp);
	}

	// Get token issue date in UTC Date object
	static getTokenIssueDate(decodedToken: any): Date | null {
		if (!decodedToken.iat) return null;
		return this.UTCToDate(decodedToken.iat);
	}

	static generateDeviceId(userAgent: string, ipAddress: string): string {
		const data = `${userAgent}-${ipAddress}-${Date.now()}`;
		return crypto.createHash('sha256').update(data).digest('hex');
	}

	static durationToUTC(duration: string) {
		const now = Date.now();
		const num = parseInt(duration);

		if (duration.endsWith('h')) return new Date(now + num * 60 * 60 * 1000).toUTCString();
		if (duration.endsWith('d')) return new Date(now + num * 24 * 60 * 60 * 1000).toUTCString();
		if (duration.endsWith('w')) return new Date(now + num * 7 * 24 * 60 * 60 * 1000).toUTCString();
		if (duration.endsWith('m')) return new Date(now + num * 60 * 1000).toUTCString();
		if (duration.endsWith('s')) return new Date(now + num * 1000).toUTCString();
		return new Date(now + num * 60 * 60 * 1000).toUTCString();
	}
}

