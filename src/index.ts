import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.config';

import express, {
	Application,
	Request,
	Response,
	json,
	urlencoded
} from "express";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/dbConfig";
import "./config/env.config";
import { errorHandler, notFound } from "./http/middlewares/errorHandler.middleware";

import RoutesMain from "./routes";


// Extend Express Request
declare global {
	namespace Express {
		interface Request {
			user?: any;
			deviceId?: string;
			userId?: string;
		}
	}
}

class ExpressApp {
	private app: Application;
	private PORT: number;
	private routesMain = new RoutesMain();

	constructor() {

		this.app = express();
		this.PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

		this.middleware();
		this.routes();
	}

	private middleware(): void {
		this.app.use(cookieParser());

		this.app.use(
			cors({
				credentials: true,
				origin: "*",
				methods: "GET,POST,PUT,DELETE",
				allowedHeaders: [
					"Content-Type",
					"Authorization",
					"X-Requested-With",
					"Cookie",
					"Access-Token",
					"Refresh-Token",
					"Access-Token-Expiry-UTC",
					"Refresh-Token-Expiry-UTC",
					"Device-Id"
				]
			})
		);

		this.app.set("trust proxy", 1);

		// ✅ EJS Setup
		this.app.set("view engine", "ejs");
		this.app.set("views", path.resolve(process.cwd(), "src/views"));

		this.app.use(urlencoded({ extended: true, limit: "50mb" }));
		this.app.use(json({ limit: "50mb" }));

		this.app.use(
			helmet({
				contentSecurityPolicy: {
					directives: {
						"script-src": ["'self'", "'unsafe-inline'"]
					}
				}
			})
		);
		this.app.use(morgan("dev"));
	}

	private routes(): void {
		// ✅ Test route (EJS)
		this.app.get("/", (req: Request, res: Response) => {
			return res.render("index", { title: "WebSocket App" });
		});

		this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

		this.routesMain.initializeAllRoutes(this.app);

		// Error handlers (must be last)
		this.app.use(errorHandler);
		this.app.use(notFound);
	}

	public listen(): void {
		// ✅ Create HTTP server



		// ✅ Start server
		this.app.listen(this.PORT, "0.0.0.0", () => {
			console.log(`🚀 Server running 	on port: ${this.PORT}`);
			connectDB();
		});
	}
}

// Start app
const server = new ExpressApp();
server.listen();