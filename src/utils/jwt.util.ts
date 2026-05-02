import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'attendsphere-access-secret-32chars!!';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'attendsphere-refresh-secret-32chars!!';

export const generateAccessToken = (payload: { userId: string; role: string; fullName: string, email: string }) =>
	jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });

export const generateRefreshToken = (payload: { userId: string }) =>
	jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

export const verifyAccessToken = (token: string) => jwt.verify(token, ACCESS_SECRET);
export const verifyRefreshToken = (token: string) => jwt.verify(token, REFRESH_SECRET);