import { Router } from 'express';
import { AttendanceController } from '../http/controllers/attendance.controller';
import { authenticate } from '../http/middlewares/auth.middleware';
import { Routes } from '../interfaces/routes.interface';


/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance records and reports
 */
export class AttendanceRoutes implements Routes {
	path?: string;
	router: Router;

	constructor() {
		this.router = Router();
		this.path = `/attendance`;
		this.initializeRoutes();
	}

	private initializeRoutes(): void {

		this.router.get(`${this.path}/history`, authenticate, AttendanceController.getHistory);

		this.router.get(`${this.path}/today`, authenticate, AttendanceController.getToday);


		this.router.get(`${this.path}/report`, authenticate, AttendanceController.getReport);
	}
}