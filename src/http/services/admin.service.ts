
import { UserRepository } from '../../repository/user.repository';
export class AdminService {
	static async getAllUsers(page: number, limit: number, search?: string) {

		return await UserRepository.findAllBasic({ page, limit, search });

	}


}