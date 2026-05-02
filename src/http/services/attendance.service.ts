import { Transaction } from "sequelize";
import * as XLSX from 'xlsx';
import { AttendanceRepository } from "../../repository/attendance.repository";


export class AttendanceService {
	static async getHistory(userId: string, page: number, limit: number) {
		const offset = (page - 1) * limit;
		return AttendanceRepository.findByUserId(userId, limit, offset);
	}

	static async getToday(userId: string) {
		const events = await AttendanceRepository.getTodayEvents(userId);

		// Calculate total working hours today from events
		let totalMinutes = 0;
		let lastCheckin: Date | null = null;

		for (const event of events) {
			if (event.event_type === 'checkin') {
				lastCheckin = new Date(event.timestamp_event);
			} else if (event.event_type === 'checkout' && lastCheckin) {
				const checkout = new Date(event.timestamp_event);
				totalMinutes += (checkout.getTime() - lastCheckin.getTime()) / (1000 * 60);
				lastCheckin = null;
			}
		}

		// If currently checked in, add time until now
		if (lastCheckin) {
			totalMinutes += (new Date().getTime() - lastCheckin.getTime()) / (1000 * 60);
		}

		const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

		return {
			events,
			totalWorkingHours: totalHours,
			isComplete: totalHours >= 8,
			sessions: events.length / 2 // Approximate
		};
	}

	static async getReport(userId: string, startDate: string, endDate: string) {
		return AttendanceRepository.getWorkingHoursByUser(userId, startDate, endDate);
	}
	static async getPaginatedAttendanceWithUser({ page, limit, search, hoursFilter, transaction }: { page: number, limit: number, search?: string, hoursFilter?: 'below_8' | 'above_8', transaction?: Transaction }) {
		return AttendanceRepository.paginatatedAttandanceQueryOfUsers({
			page,
			limit,
			search,
			hoursFilter,
			transaction
		});
	}
	static async generateMISReport(startDate: string, endDate: string) {
		const reportData = await AttendanceRepository.getAllWorkingHours(startDate, endDate);

		const worksheet = XLSX.utils.json_to_sheet(reportData.map((row: any) => ({
			'Employee ID': row.user_id,
			'Employee Name': row.full_name,
			'Date': row.event_date,
			'Working Hours': row.working_hours
		})));

		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'MIS Report');

		return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
	}


}