import { config } from 'dotenv';
import path from 'path';

const NODE_ENV = process.env.NODE_ENV || 'dev';

// Map environment → file
const envFileMap: Record<string, string> = {
	dev: '.env.dev',
	developement: '.env.dev',
	prod: '.env.prod',
	production: '.env.prod',
	test: '.env.test'
};

// fallback to .env if not matched
export const envFile = envFileMap[NODE_ENV] || '.env';

const envPath = path.resolve(process.cwd(), envFile);

config({ path: envPath });

console.log(`🌍 Loaded ENV: ${envFile}`);
