import { NextFunction, Request, Response } from 'express';


import { DEFAULT_PAGE_SIZE } from '../../utils/constants.util';
import { AdminService } from '../services/admin.service';

export class AdminController {
	static async getUsers(req: Request, res: Response, next: NextFunction) {
		try {
			const page = Number(req.query.page) || 1;
			const limit = Number(req.query.limit) || DEFAULT_PAGE_SIZE;

			const result = await AdminService.getAllUsers(page, limit);
			return res.status(200).json({
				success: true,
				data: result.data,
				pagination: result.pagination
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * ✅ NEW: Get user's GPS location history (admin only)
	 */
	static async getUserLocationHistory(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params;
			const { startDate, endDate } = req.query as { startDate: string; endDate: string };

			if (!startDate || !endDate) {
				return res.status(400).json({
					success: false,
					message: 'startDate and endDate are required'
				});
			}

			const data = await AdminService.getUserLocationHistory(id, startDate, endDate);
			return res.status(200).json({ success: true, data });
		} catch (error) {
			next(error);
		}
	}

	static async getUserReport(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params;
			const { startDate, endDate } = req.query as { startDate: string; endDate: string };

			if (!startDate || !endDate) {
				return res.status(400).json({
					success: false,
					message: 'startDate and endDate are required'
				});
			}

			const data = await AdminService.getUserReport(id, startDate, endDate);
			return res.status(200).json({ success: true, data });
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

			const buffer = await AdminService.generateMISReport(startDate, endDate);

			res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
			res.setHeader('Content-Disposition', `attachment; filename=AttendSphere_MIS_${startDate}_${endDate}.xlsx`);

			return res.status(200).send(buffer);
		} catch (error) {
			next(error);
		}
	}
}