
import { QueryTypes, Transaction } from 'sequelize';
import { executeQuery } from '../utils/executeQuery.util';

export class DeviceRepository {
	static async create(data: {
		userId: string; androidId: string; deviceModel: string;
		osVersion: string; fingerprint: string;
	}, transaction?: any) {
		return await executeQuery({
			query: `
        INSERT INTO devices (id, user_id, android_id, device_model, os_version, fingerprint)
        VALUES (gen_random_uuid(), :userId, :androidId, :deviceModel, :osVersion, :fingerprint)
        RETURNING user_id, android_id, device_model, os_version, fingerprint
      `,
			replacements: data,
			type: QueryTypes.INSERT,
			transaction
		});
	}

	static async findByUserId(userId: string, transaction?: Transaction) {
		return await executeQuery<any[]>({
			query: `SELECT * FROM devices WHERE user_id = :userId LIMIT 1`,
			replacements: { userId },
			type: QueryTypes.SELECT,
			transaction
		});
	}

	static async findByAndroidId(androidId: string) {
		return await executeQuery<any[]>({
			query: `SELECT d.*, u.id as user_id, u.email, u.role FROM devices d
              JOIN users u ON u.id = d.user_id
              WHERE d.android_id = :androidId LIMIT 1`,
			replacements: { androidId },
			type: QueryTypes.SELECT
		});
	}

	static async findByFingerPrint(fingerPrint: string) {
		return await executeQuery<any[]>({
			query: `SELECT d.* FROM devices d WHERE d.fingerprint = :fingerPrint LIMIT 1`,
			replacements: { fingerPrint },
			type: QueryTypes.SELECT
		});
	}

	static async updateByUserId(data: {
		userId: string; androidId: string; deviceModel: string;
		osVersion: string; fingerprint: string;
	}, transaction?: any) {
		return await executeQuery({
			query: `
        UPDATE devices
        SET android_id = :androidId, device_model = :deviceModel,
            os_version = :osVersion, fingerprint = :fingerprint
        WHERE user_id = :userId
      `,
			replacements: data,
			type: QueryTypes.UPDATE,
			transaction
		});
	}
}