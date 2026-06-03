import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { getRedisClient } from '../redis/redis.client';
import { env } from '../config/env.config';
import { TooManyRequestsError } from '../errors/AppError';
import { Request, Response } from 'express';

function redisStore() {
  return {
    async increment(key: string) {
      const redis = getRedisClient();
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, Math.ceil(env.rateLimit.windowMs / 1000));
      }
      const ttl = await redis.ttl(key);
      return { totalHits: current, resetTime: new Date(Date.now() + ttl * 1000) };
    },
    async decrement(key: string) {
      await getRedisClient().decr(key);
    },
    async resetKey(key: string) {
      await getRedisClient().del(key);
    },
  };
}

export const globalRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, next: (err: Error) => void) => {
    next(new TooManyRequestsError('Too many requests. Please try again later.'));
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
  const ipKey = ipKeyGenerator(req.ip ?? '');
  const phone = (req.body as { phone?: string }).phone ?? '';
  return `auth:${ipKey}:${phone}`;
},
  handler: (_req: Request, _res: Response, next: (err: Error) => void) => {
    next(new TooManyRequestsError('Too many OTP attempts. Please try again in 15 minutes.'));
  },
});

export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, next: (err: Error) => void) => {
    next(new TooManyRequestsError('Too many requests'));
  },
});
