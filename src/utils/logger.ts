
import { existsSync, mkdirSync } from 'fs';
import { join } from 'node:path';
import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';
import "../config/env.config";


console.info('process.env.NODE_ENV >>>> ', process.env.NODE_ENV);

// Logs root directory
const logDir: string = join(__dirname, process.env.LOG_DIR!);

if (!existsSync(logDir)) mkdirSync(logDir);

// Function to ensure subfolder exists
function ensureDir(subDir: string) {
	const fullPath = join(logDir, subDir);
	if (!existsSync(fullPath)) mkdirSync(fullPath, { recursive: true });
	return fullPath;
}

// Ensure subfolders exist
ensureDir('debug');
ensureDir('error');
ensureDir('database');

// Define log format for console
const consoleFormat = winston.format.combine(
	winston.format.colorize(),
	winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
);

// Define file format
const fileFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.json());

const logger = winston.createLogger({
	format: fileFormat,
	transports: [
		// Debug logs
		new winstonDaily({
			level: 'debug',
			datePattern: 'YYYY-MM-DD',
			dirname: join(logDir, 'debug'),
			filename: `%DATE%.log`,
			maxFiles: 30,
			zippedArchive: true
		}),

		// Error logs
		new winstonDaily({
			level: 'error',
			datePattern: 'YYYY-MM-DD',
			dirname: join(logDir, 'error'),
			filename: `%DATE%.log`,
			maxFiles: 30,
			handleExceptions: true,
			zippedArchive: true
		}),

		// Database logs (filter using 'label' property)
		new winstonDaily({
			level: 'debug',
			datePattern: 'YYYY-MM-DD',
			dirname: join(logDir, 'database'),
			filename: `%DATE%.log`,
			maxFiles: 30,
			zippedArchive: true,
			format: winston.format.combine(winston.format((info) => (info.label === 'database' ? info : false))(), winston.format.json())
		})
	]
});

// Console output
logger.add(
	new winston.transports.Console({
		format: winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), consoleFormat)
	})
);

// Stream for morgan or other middleware
const stream = {
	write: (message: string) => {
		logger.info(message.trim());
	}
};

export { logger, stream };
