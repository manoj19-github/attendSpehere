import { OfficeConfig } from "../types";

/**
 * Checks if current time is within working hours.
 * Default: Monday–Friday, 09:00–18:00
 */
export const isWithinWorkingHours = ({ now = new Date(), officeConfig }: { now: Date; officeConfig: OfficeConfig }): boolean => {
	const day = now.getDay();
	if (!officeConfig.WORKING_HOURS.days.includes(day)) {

		return false;
	}

	const hour = now.getHours();
	const minute = now.getMinutes();
	const timeDecimal = hour + minute / 60;

	return timeDecimal >= officeConfig.WORKING_HOURS.start && timeDecimal <= officeConfig.WORKING_HOURS.end;
};

/**
 * Gets next working day start time (9 AM)
 */
export const getNextWorkingDayStart = (): Date => {
	const now = new Date();
	const next = new Date(now);
	next.setHours(9, 0, 0, 0);

	if (now.getDay() === 5) {
		next.setDate(next.getDate() + 3); // Friday -> Monday
	} else if (now.getDay() === 6) {
		next.setDate(next.getDate() + 2); // Saturday -> Monday
	} else {
		next.setDate(next.getDate() + 1); // Next day
	}
	return next;
};