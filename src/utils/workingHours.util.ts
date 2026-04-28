/**
 * Checks if current time is within working hours.
 * Default: Monday–Friday, 09:00–18:00
 */
export const isWithinWorkingHours = (date: Date = new Date()): boolean => {
	const day = date.getDay();
	if (day === 0 || day === 6) return false;

	const hour = date.getHours();
	const minute = date.getMinutes();
	const timeDecimal = hour + minute / 60;

	return timeDecimal >= 9 && timeDecimal < 18;
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