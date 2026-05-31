import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  node: {
    env: optional('NODE_ENV', 'development'),
    port: parseInt(optional('PORT', '4001'), 10),
    isProd: process.env.NODE_ENV === 'production',
    isDev: process.env.NODE_ENV !== 'production',
  },
  db: {
    uri: required('MONGO_URI'),
  },
  redis: {
    host: optional('REDIS_HOST', 'localhost'),
    port: parseInt(optional('REDIS_PORT', '6379'), 10),
    password: process.env.REDIS_PASSWORD,
    ttl: {
      otp: parseInt(optional('OTP_TTL_SECONDS', '300'), 10),
      session: parseInt(optional('SESSION_TTL_SECONDS', '86400'), 10),
      cache: parseInt(optional('CACHE_TTL_SECONDS', '300'), 10),
      seatLock: parseInt(optional('SEAT_LOCK_TTL_SECONDS', '600'), 10),
    },
  },
  jwt: {
    secret: required('JWT_SECRET'),
    accessExpiry: optional('JWT_EXPIRES_IN', '15m'),
    refreshExpiry: optional('REFRESH_EXPIRES_IN', '7d'),
    adminExpiry: optional('JWT_EXPIRES_IN_ADMIN', '1h'),
  },
  rateLimit: {
    windowMs: parseInt(optional('RATE_WINDOW_MS', String(15 * 60 * 1000)), 10),
    max: parseInt(optional('RATE_MAX', '100'), 10),
    authMax: parseInt(optional('AUTH_RATE_MAX', '10'), 10),
  },
  smtp: {
    host: optional('SMTP_HOST', ''),
    port: parseInt(optional('SMTP_PORT', '587'), 10),
    user: optional('SMTP_USER', ''),
    pass: optional('SMTP_PASS', ''),
    from: optional('SMTP_FROM', 'noreply@busbooking.com'),
  },
  sms: {
    apiKey: optional('SMS_API_KEY', ''),
    senderId: optional('SMS_SENDER_ID', 'BUSAPP'),
  },
  bullBoard: {
    path: optional('BULL_BOARD_PATH', '/admin/queues'),
    username: optional('BULL_BOARD_USER', 'admin'),
    password: optional('BULL_BOARD_PASS', 'changeme'),
  },
  cors: {
    origins: optional('CORS_ORIGINS', '*').split(','),
  },
} as const;
