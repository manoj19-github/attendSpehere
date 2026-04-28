import { Router } from 'express';
import { DeviceRegisterDTO } from '../dtos/devices.dto';
import { DeviceController } from '../http/controllers/device.controller';
import DTOValidationMiddleware from '../http/middlewares/apiValidator.middleware';
import { authenticate } from '../http/middlewares/auth.middleware';
import { Routes } from '../interfaces/routes.interface';


/**
 * @swagger
 * tags:
 *   name: Device
 *   description: Device registration and management
 */
export class DeviceRoutes implements Routes {
	path?: string;
	router: Router;

	constructor() {
		this.router = Router();
		this.path = `/device`;
		this.initializeRoutes();
	}

	private initializeRoutes(): void {

		this.router.post(
			`${this.path}/register`,
			DTOValidationMiddleware(DeviceRegisterDTO),
			authenticate,
			DeviceController.registerDevice
		);

		this.router.get(`${this.path}/user`, authenticate, DeviceController.getUserDevice);
	}
}