import { Router } from 'express';
import { LoginDTO } from '../dtos/login.dto';

import { RegistrationDTO } from '../dtos/registration.dto';
import { AuthController } from '../http/controllers/auth.controller';
import DTOValidationMiddleware from '../http/middlewares/apiValidator.middleware';
import { Routes } from '../interfaces/routes.interface';



/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */
export class AuthRoutes implements Routes {
	path?: string;
	router: Router;

	constructor() {
		this.router = Router();
		this.path = `/auth`;
		this.initializeRoutes();
	}

	private initializeRoutes(): void {

		this.router.post(`${this.path}/register`, DTOValidationMiddleware(RegistrationDTO), AuthController.register);


		this.router.post(`${this.path}/login`, DTOValidationMiddleware(LoginDTO), AuthController.login);


		this.router.post(`${this.path}/refresh`, AuthController.refreshToken);
	}
}