import { AttendanceRepository } from "../../repository/attendance.repository";

export class AttendanceService {
	static async getHistory(userId: string, page: number, limit: number) {
		const offset = (page - 1) * limit;
		return AttendanceRepository.findByUserId(userId, limit, offset);
	}

	/**
	 * Returns daily working hours by querying the VIEW.
	 * The view pairs checkin/checkout events into sessions and sums hours.
	 */
	static async getReport(userId: string, startDate: string, endDate: string) {
		return AttendanceRepository.getWorkingHoursByUser(userId, startDate, endDate);
	}

	/**
	 * Admin-level: daily working hours for ALL employees in date range.
	 */
	static async getDailyWorkingHoursReport(startDate: string, endDate: string) {
		return AttendanceRepository.getAllWorkingHours(startDate, endDate);
	}
}