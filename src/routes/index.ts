import { Application } from 'express';
import { Routes } from '../interfaces/routes.interface';
import { AdminRoutes } from './admin.route';
import { AttendanceRoutes } from './attendance.route';
import { AuthRoutes } from './auth.route';
import { DeviceRoutes } from './device.route';
import { LocationRoutes } from './location.route';
import { OfficeSettingsRoutes } from './officeSettings.route';

class RoutesMain {
	private routes: Routes[] = [new AdminRoutes(), new AuthRoutes(), new DeviceRoutes(), new LocationRoutes(), new AttendanceRoutes(), new OfficeSettingsRoutes()]; // add all routes  here
	constructor() { }
	public initializeAllRoutes(app: Application) {
		this.routes.forEach((route) => {
			app.use('/api/', route.router);
		});
	}
}

export default RoutesMain;
