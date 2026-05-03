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



export interface RedisUserState {
	status: 'in_office_area' | 'out_office_area';
	lastDistanceMark: number;
	lastIntervalTime: string | null;
	currentLat: number;
	currentLng: number;
	lastCheckinDate: string | null;
	fullName?: string;
	email?: string;
	lastEmitTime?: string;
	lastSeen?: string;
	distance?: number;
}
