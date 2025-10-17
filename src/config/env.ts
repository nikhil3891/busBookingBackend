// src/config/env.ts
// Centralized environment config with runtime validation and typed values.

import dotenv from 'dotenv';
import path from 'path';

// load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// helper: read env var or fallback
const get = (k: string, fallback = ''): string => process.env[k] ?? fallback;

// export a single env object used across the app
const env = {
  // parse numeric port
  port: Number(get('PORT', '4001')),

  // MongoDB connection string (required)
  mongoUri: get('MONGO_URI'),

  // jwt secret and expiry
  jwtSecret: get('JWT_SECRET'),
  jwtExpiresIn: get('JWT_EXPIRES_IN', '15m'),
  jwtExpiresInAdmin: get('JWT_EXPIRES_IN_ADMIN', ''), // optional
  refreshTokenExpiresIn: get('REFRESH_EXPIRES_IN', '7d'),

  // rate limiter config
  rateLimit: {
    windowMs: Number(get('RATE_WINDOW_MS', String(15 * 60 * 1000))),
    max: Number(get('RATE_MAX', '100')),
  },

  // SMTP for nodemailer (optional)
  smtp: {
    host: get('SMTP_HOST'),
    user: get('SMTP_USER'),
    pass: get('SMTP_PASS'),
  },
  nodeEnv: get('NODE_ENV', 'development')
};

// fail fast if essential values missing
if (!env.mongoUri) {
  throw new Error('MONGO_URI is required in environment');
}
if (!env.jwtSecret) {
  throw new Error('JWT_SECRET is required in environment');
}

export default env;
