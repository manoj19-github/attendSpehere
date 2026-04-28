import { Request } from 'express';
export interface RequestWithUser extends Request {
	user: any;
	body: any;

}
export interface IUser {
	_id: string;
	email: string;
}



export interface AuthJWTPayload {
	userId: string;
	email: string;
	deviceId: string;
	tokenType: 'access' | 'refresh';
	iat?: number;
	exp?: number;
}
