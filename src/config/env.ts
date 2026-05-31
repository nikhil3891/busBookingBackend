import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const get = (k: string, fallback = ''): string => process.env[k] ?? fallback;

const env = {
  port: Number(get('PORT', '4001')),
  mongoUri: get('MONGO_URI'),
  jwtSecret: get('JWT_SECRET') as string,  // ✅ Cast ensures it's always string
  jwtExpiresIn: get('JWT_EXPIRES_IN', '15m'),
  jwtExpiresInUser: get('JWT_EXPIRES_IN_USER', get('JWT_EXPIRES_IN', '15m')), // ✅ User-specific JWT expiry
  jwtExpiresInAdmin: get('JWT_EXPIRES_IN_ADMIN', '1h'),
  refreshTokenExpiresIn: get('REFRESH_EXPIRES_IN', '7d'),
  rateLimit: {
    windowMs: Number(get('RATE_WINDOW_MS', String(15 * 60 * 1000))),
    max: Number(get('RATE_MAX', '100')),
  },
  smtp: {
    host: get('SMTP_HOST'),
    user: get('SMTP_USER'),
    pass: get('SMTP_PASS'),
  },
  nodeEnv: get('NODE_ENV', 'development'),
};

// Validate required vars early
if (!env.mongoUri) throw new Error('❌ MONGO_URI missing in .env');
if (!env.jwtSecret) throw new Error('❌ JWT_SECRET missing in .env');

export default env;
