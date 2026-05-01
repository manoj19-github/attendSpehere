import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/dbConfig';

export class OfficeSetting extends Model {
	public id!: number;
	public name!: string;
	public lat!: number;
	public lng!: number;
	public radius!: number;
}

OfficeSetting.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'AttendSphere HQ',
		},
		lat: {
			type: DataTypes.FLOAT,
			allowNull: false,
		},
		lng: {
			type: DataTypes.FLOAT,
			allowNull: false,
		},
		radius: {
			type: DataTypes.INTEGER,
			allowNull: false,
			comment: 'Radius in meters',
		},
	},
	{
		sequelize,
		tableName: 'office_settings',
		timestamps: true,
	}
);