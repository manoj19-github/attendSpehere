import swaggerJsdoc, { Options } from 'swagger-jsdoc';

const options: Options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'AttendSphere API',
			version: '1.0.0',
			description: 'API documentation for AttendSphere backend'
		},
		servers: [
			{
				url: 'http://localhost:5000/api'
			}
		]
	},
	apis: [
		'./src/routes/*.ts',
		'./src/http/controllers/*.ts',
		'./src/swaggerDocs/*.ts'
	] // scan files
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
