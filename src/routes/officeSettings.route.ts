import { Router } from 'express';

import { OfficeSettingsController } from '../http/controllers/officeSettings.controller';
import { authenticate, authorizeAdmin } from '../http/middlewares/auth.middleware';
import { Routes } from '../interfaces/routes.interface';

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only operations and reports
 */
export class OfficeSettingsRoutes implements Routes {
	path?: string | undefined;
	router: Router;

	constructor() {
		this.router = Router();
		this.path = `/office-settings`;
		this.initializeRoutes();
	}

	private initializeRoutes(): void {

		this.router.get(`${this.path}`, authenticate, OfficeSettingsController.getConfig);


		this.router.put(`${this.path}`, authenticate, authorizeAdmin, OfficeSettingsController.updateConfig);
	}
}