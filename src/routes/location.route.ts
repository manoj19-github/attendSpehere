import { Router } from 'express';
import { LocationController } from '../http/controllers/location.controller';
import { authenticate } from '../http/middlewares/auth.middleware';
import { Routes } from '../interfaces/routes.interface';


/**
 * @swagger
 * tags:
 *   name: Location
 *   description: Geolocation tracking and geofence
 */
export class LocationRoutes implements Routes {
	path?: string;
	router: Router;

	constructor() {
		this.router = Router();
		this.path = `/location`;
		this.initializeRoutes();
	}

	private initializeRoutes(): void {

		this.router.post(`${this.path}/ping`, authenticate, LocationController.ping);


		this.router.post(`${this.path}/checkin`, authenticate, LocationController.manualCheckin);
		this.router.post(`${this.path}/checkout`, authenticate, LocationController.manualCheckout);


	}
}