import { sequelize } from '../../config/dbConfig';
import { DeviceRepository } from '../../repository/device.repository';


export class DeviceService {
	static async registerDevice(
		userId: string, androidId: string, deviceModel: string, osVersion: string, fingerprint: string
	) {
		const transaction = await sequelize.transaction();
		try {
			const existing = await DeviceRepository.findByUserId(userId);

			if (existing.length > 0) {
				await DeviceRepository.updateByUserId(
					{ userId, androidId, deviceModel, osVersion, fingerprint }, transaction
				);
			} else {
				await DeviceRepository.create(
					{ userId, androidId, deviceModel, osVersion, fingerprint }, transaction
				);
			}

			await transaction.commit();
			return { message: 'Device registered successfully' };
		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	}

	static async getUserDevice(userId: string) {
		const devices = await DeviceRepository.findByUserId(userId);
		if (devices.length === 0) throw new Error('No device found');
		return devices[0];
	}
}