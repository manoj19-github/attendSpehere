import { NextFunction, Request, Response } from 'express';


import { LocationService } from '../services/location.service';


export class LocationController {
	static async ping(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.userId;
			const { lat, lng } = req.body;

			if (lat === undefined || lng === undefined) {
				return res.status(400).json({
					success: false,
					message: 'lat and lng are required'
				});
			}

			const result = await LocationService.processPing(
				userId, parseFloat(lat), parseFloat(lng)
			);

			return res.status(200).json({ success: true, data: result });
		} catch (error) {
			next(error);
		}
	}

	static async manualCheckin(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.userId;
			const { lat, lng } = req.body;

			if (lat === undefined || lng === undefined) {
				return res.status(400).json({
					success: false,
					message: 'lat and lng are required for checkin'
				});
			}

			const result = await LocationService.manualCheckin(
				userId, parseFloat(lat), parseFloat(lng)
			);

			return res.status(200).json({ success: true, data: result });
		} catch (error) {
			next(error);
		}
	}
}