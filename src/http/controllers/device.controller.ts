import { NextFunction, Request, Response } from 'express';


import { DeviceService } from '../services/device.service';

export class DeviceController {
	static async registerDevice(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.userId;
			const { androidId, deviceModel, osVersion, fingerprint } = req.body;

			if (!androidId || !deviceModel || !osVersion) {
				return res.status(400).json({
					success: false,
					message: 'androidId, deviceModel, and osVersion are required'
				});
			}

			const result = await DeviceService.registerDevice(
				userId, androidId, deviceModel, osVersion, fingerprint || ''
			);

			return res.status(201).json({ success: true, message: result.message });
		} catch (error) {
			next(error);
		}
	}

	static async getUserDevice(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.userId;
			const device = await DeviceService.getUserDevice(userId);
			return res.status(200).json({ success: true, data: device });
		} catch (error) {
			next(error);
		}
	}
}