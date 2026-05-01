import { NextFunction, Request, Response } from 'express';



import { DEFAULT_PAGE_SIZE } from '../../utils/constants.util';
import { logger } from '../../utils/logger';
import { AttendanceService } from '../services/attendance.service';
import { LocationService } from '../services/location.service';

export class AttendanceController {
	static async getHistory(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.userId;
			const page = Number(req.query.page) || 1;
			const limit = Number(req.query.limit) || DEFAULT_PAGE_SIZE;

			logger.info({ userId, page, limit });

			const data = await AttendanceService.getHistory(userId, page, limit);
			logger.info('data:  18 ', data);
			return res.status(200).json({ success: true, data });
		} catch (error) {
			next(error);
		}
	}

	static async getToday(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.userId;
			const data = await AttendanceService.getToday(userId);


			if (userId)
				await LocationService.cleanOldKeys(userId);

			return res.status(200).json({ success: true, data });
		} catch (error) {

			next(error);
		}
	}

	static async getReport(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.userId;
			const { startDate, endDate } = req.query as { startDate: string; endDate: string };

			if (!startDate || !endDate) {
				return res.status(400).json({
					success: false,
					message: 'startDate and endDate are required'
				});
			}

			const data = await AttendanceService.getReport(userId, startDate, endDate);
			return res.status(200).json({ success: true, data });
		} catch (error) {
			next(error);
		}
	}
}