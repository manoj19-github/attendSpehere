import { Router } from 'express';
import { AdminController } from '../http/controllers/admin.controller';
import { authenticate, authorizeAdmin } from '../http/middlewares/auth.middleware';
import { Routes } from '../interfaces/routes.interface';

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only operations and reports
 */
export class AdminRoutes implements Routes {
	path?: string | undefined;
	router: Router;

	constructor() {
		this.router = Router();
		this.path = `/admin`;
		this.initializeRoutes();
	}

	private initializeRoutes(): void {

		this.router.get(`${this.path}/users`, authenticate, authorizeAdmin, AdminController.getUsers);


		this.router.get(`${this.path}/user/:id/location-history`, authenticate, authorizeAdmin, AdminController.getUserLocationHistory);


		this.router.get(`${this.path}/mis-report`, authenticate, authorizeAdmin, AdminController.downloadMISReport);
		this.router.get(`${this.path}/user/:id/report`, authenticate, authorizeAdmin, AdminController.getUserReport);
	}
}