import { NextFunction, Request, Response } from 'express';


import { Transaction } from 'sequelize';
import { sequelize } from '../../config/dbConfig';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants.util';
import { AdminService } from '../services/admin.service';
import { AttendanceService } from '../services/attendance.service';
import { LocationService } from '../services/location.service';

export class AdminController {
	static async getUsers(req: Request, res: Response, next: NextFunction) {
		try {
			const page = Number(req.query.page) || 1;
			const limit = Number(req.query.limit) || DEFAULT_PAGE_SIZE;
			const search = String(req?.query?.search ?? "")

			const result = await AdminService.getAllUsers(page, limit, search);
			return res.status(200).json({
				success: true,
				data: result.data,
				pagination: result.pagination
			});
		} catch (error) {
			next(error);
		}
	}





	static async downloadMISReport(req: Request, res: Response, next: NextFunction) {
		try {
			const { startDate, endDate } = req.query as { startDate: string; endDate: string };

			if (!startDate || !endDate) {
				return res.status(400).json({
					success: false,
					message: 'startDate and endDate are required'
				});
			}

			const buffer = await AttendanceService.generateMISReport(startDate, endDate);

			res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
			res.setHeader('Content-Disposition', `attachment; filename=AttendSphere_MIS_${startDate}_${endDate}.xlsx`);

			return res.status(200).send(buffer);
		} catch (error) {
			next(error);
		}
	}



	static async getAllUsersLatestLocation(req: Request, res: Response, next: NextFunction) {
		try {
			const data = await LocationService.getAllUsersLatestLocation();
			return res.status(200).json({ success: true, data });
		} catch (error) {
			next(error);
		}
	}
	static async getUserLocations(req: Request, res: Response, next: NextFunction) {
		try {
			const { startDate, endDate } = req.query as {
				startDate?: string;
				endDate?: string;
				page?: string;
				limit?: string;
				userId?: string;
			};
			const userId = String(req?.query?.userId ?? "")
			const today = new Date().toISOString().split('T')[0];

			const data = await LocationService.getUserLocationHistory(
				{ startDate: startDate || today, endDate: endDate || today, page: Number(req.query.page), limit: Number(req.query.limit), userId, search: String(req?.query?.search ?? "") }
			);

			return res.status(200).json({ success: true, data });
		} catch (error) {
			next(error);
		}
	}
	static async getPaginatedAttendanceWithUser(req: Request, res: Response, next: NextFunction) {
		let transaction: Transaction | undefined;
		try {
			transaction = await sequelize.transaction();
			const { page, limit, search, hoursFilter } = req.query as { page?: string; limit?: string; search?: string; hoursFilter?: string };
			const data = await AttendanceService.getPaginatedAttendanceWithUser({ page: Number(page), limit: Number(limit), search: search ?? '', hoursFilter: (hoursFilter as any) ?? undefined });
			await transaction.commit();
			return res.status(200).json({ success: true, data });
		} catch (error) {
			transaction?.rollback();
			next(error);
		}
	}
}