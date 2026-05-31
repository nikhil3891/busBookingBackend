import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import morgan from 'morgan';
import passport from 'passport';
import './passport/jwt.strategy';

import { errorHandler } from './core/errors/errorHandler';
import { globalRateLimiter } from './core/middlewares/rate-limit.middleware';
import { env } from './core/config/env.config';
import routes from './routes/index';

// Bull Board for queue monitoring
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue } from './jobs/queues/email.queue';
import { smsQueue } from './jobs/queues/sms.queue';
import { invoiceQueue } from './jobs/queues/invoice.queue';
import { analyticsQueue } from './jobs/queues/analytics.queue';

const app = express();

// ─── Security Headers ───────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.cors.origins.includes('*') ? '*' : env.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
  }),
);

// ─── Body & Security Parsers ─────────────────────────────────────────────────
app.use(hpp());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ─────────────────────────────────────────────────────────────────
app.use(morgan(env.node.isProd ? 'combined' : 'dev'));

// ─── Passport ────────────────────────────────────────────────────────────────
app.use(passport.initialize());

// ─── Bull Board (admin queue monitoring) ─────────────────────────────────────
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath(env.bullBoard.path);

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(smsQueue),
    new BullMQAdapter(invoiceQueue),
    new BullMQAdapter(analyticsQueue),
  ],
  serverAdapter,
});

app.use(env.bullBoard.path, serverAdapter.getRouter());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    version: process.env['npm_package_version'] ?? '1.0.0',
    environment: env.node.env,
  });
});

// ─── Serve Invoice PDFs ───────────────────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api', globalRateLimiter);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: 'Route not found',
  });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
