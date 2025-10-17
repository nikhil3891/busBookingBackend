import express, { Request, Response } from "express";
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import morgan from 'morgan';
import passport from 'passport';
import rateLimiter from './middlewares/rateLimiterMiddleware';
import errorHandler from './middlewares/errorHandler';
import { json, urlencoded } from 'express';

// import authRoutes from './routes/auth.routes';
import './passport/jwt.strategy';
// import routes from "./routes";


const app = express();

// Security headers
app.use(helmet());

// CORS: in production configure origin whitelist
app.use(cors());

// Protect from HTTP parameter pollution attacks
app.use(hpp());

app.use(express.json());
app.use(urlencoded({ extended: true }));

// Simple logging middleware (use winston in production)
app.use(morgan('dev'));

// Initialize passport (JWT strategy will be used on protected routes)
app.use(passport.initialize());

// Centralized error handler (last)
// app.use(errorHandler);

app.get("/", (req: Request, res: Response) => {
  res.send("Bus booking backend (TypeScript) is running 🚍");
});

// ✅ Example API route
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.use('/api', rateLimiter);
// app.use("/api", routes);

app.use(errorHandler);

export default app;
