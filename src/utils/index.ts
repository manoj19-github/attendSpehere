import { registerDecorator, ValidationOptions } from 'class-validator';
import { HttpException } from '../http/exceptions/http.exceptions';
import { OfficeSettingsService } from '../http/services/officeSettings.service';
import { logger } from './logger';
export class UtilsMain {



	static async loadOfficeConfigToCache(): Promise<void> {
		try {
			await OfficeSettingsService.getConfig();


			logger.info('✅ Office config cached in Redis');
		} catch (error) {
			logger.error('❌ Failed to cache office config:', error);
		}
	};

	static getDateInIST(date: Date): string {
		return date.toLocaleDateString('en-CA', {
			timeZone: 'Asia/Kolkata',
		});
	}

}

export const SERVICES = ['AUTHSERVICE'];

export enum APIMETHODS {
	get = 'get',
	post = 'pos',
	put = 'put',
	delete = 'delete'
}

export function IsCustomEmail(validationOptions: ValidationOptions) {
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'isCustomEmail',
			target: object.constructor,
			propertyName: propertyName,
			constraints: [],
			options: validationOptions,
			validator: {
				validate(value) {
					// Custom regex for email validation
					const emailRegex =
						/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
					return typeof value === 'string' && emailRegex.test(value);
				},
				defaultMessage(args) {
					return `${args?.property} must be a valid email address`;
				}
			}
		});
	};
}

export enum MatchStatus {
	scheduled = "scheduled",
	live = "live",
	finished = "finished"
}




export const getMatchStatus = (
	startTime: Date | string,
	endTime: Date | string
): MatchStatus => {
	const now = new Date();

	const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
	const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

	// ❌ invalid date guard
	if (isNaN(start.getTime()) || isNaN(end.getTime())) {
		throw new HttpException(400, 'Invalid date provided to getMatchStatus');
	}

	if (now < start) {
		return MatchStatus.scheduled;
	}

	if (now >= start && now <= end) {
		return MatchStatus.live;
	}

	return MatchStatus.finished;
};