
import { Router } from 'express';
import { LocationController } from '../http/controllers/location.controller';
import { authenticate } from '../http/middlewares/auth.middleware';
import { Routes } from '../interfaces/routes.interface';

/**
 * @swagger
 * tags:
 *   name: Location
 *   description: Real-time geolocation tracking and geofence detection
 */
export class LocationRoutes implements Routes {
	path?: string | undefined;
	router: Router;

	constructor() {
		this.router = Router();
		this.path = `/location`;
		this.initializeRoutes();
	}

	private initializeRoutes(): void {

		this.router.post(`${this.path}/ping`, authenticate, LocationController.ping);
	}
}