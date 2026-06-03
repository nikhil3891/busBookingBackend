// src/middlewares/rateLimiter.middleware.ts
// Basic express-rate-limit middleware; for multi-instance use a Redis store.

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import env from '../config/env';

const limiter = rateLimit({
  windowMs: env.rateLimit.windowMs, // e.g., 15 minutes
  max: env.rateLimit.max, // limit each IP to X requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

export default limiter;
