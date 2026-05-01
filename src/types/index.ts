export class AllTypesMain { }


// types/office.types.ts
export interface WorkingHours {
	start: number;
	end: number;
	days: number[];
}

export interface OfficeConfig {
	OFFICE_LAT: number;
	OFFICE_LNG: number;
	OFFICE_RADIUS: number;
	OFFICE_NAME: string;
	OFFICE_ADDRESS: string;

	LOCATION_POLLING_INTERVAL: number;

	DISTANCE_THRESHOLD: number;
	TIME_INTERVAL_MS: number;

	WORKING_HOURS: {
		start: number;
		end: number;
		days: number[];
	};
}