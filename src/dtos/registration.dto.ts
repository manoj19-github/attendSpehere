import { Trim } from 'class-sanitizer';
import {
	IsIn,
	IsNotEmpty,
	IsOptional,
	IsString,
	MinLength
} from 'class-validator';
import { IssantraNotesEmail } from './customEmail.decorator';

export class RegistrationDTO {
	@IsString()
	@Trim()
	@IsNotEmpty()
	@MinLength(4, { message: 'Full name should be minimum 4 characters' })
	fullName!: string;

	@IssantraNotesEmail()
	@Trim()
	@IsNotEmpty()
	email!: string;

	@IsString()
	@Trim()
	@IsNotEmpty()
	@MinLength(6, { message: 'Password should be minimum 6 characters' })
	password!: string;

	@IsOptional()
	@IsIn(['admin', 'employee'], {
		message: 'Role must be admin or employee'
	})
	role?: 'admin' | 'employee' = 'employee';

	// Device binding fields

	@IsString()
	@Trim()
	fingerPrint!: string;


	@IsString()
	@Trim()
	androidId!: string;


	@IsString()
	@Trim()
	deviceModel!: string;


	@IsString()
	@Trim()
	osVersion!: string;
}