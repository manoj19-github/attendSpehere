// office.controller.ts
import { NextFunction, Request, Response } from 'express';
import { Transaction } from 'sequelize';
import { sequelize } from '../../config/dbConfig';
import { OfficeSettingsService } from '../services/officeSettings.service';


export class OfficeSettingsController {

	static async getConfig(req: Request, res: Response, next: NextFunction) {
		let transaction: Transaction | undefined;
		try {
			transaction = await sequelize.transaction();
			const config = await OfficeSettingsService.getConfig(transaction);
			transaction.commit();

			return res.status(200).json({
				success: true,
				data: config,
			});
		} catch (error) {
			transaction?.rollback();
			next(error);
		}
	}

	static async updateConfig(req: Request, res: Response, next: NextFunction) {
		let transaction: Transaction | undefined;
		try {
			transaction = await sequelize.transaction();
			const updated = await OfficeSettingsService.updateConfig(req.body, transaction);
			transaction.commit();


			return res.status(200).json({
				success: true,
				message: 'Config updated successfully',
				data: updated,
			});
		} catch (error) {
			transaction?.rollback();
			next(error);
		}
	}
}