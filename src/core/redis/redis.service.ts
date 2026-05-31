import { getRedisClient } from './redis.client';
import { env } from '../config/env.config';

const PREFIX = {
  OTP: 'otp:',
  SESSION: 'sess:',
  SEAT_LOCK: 'seat_lock:',
  RATE: 'rate:',
  CACHE: 'cache:',
  BUS: 'bus:',
  ANALYTICS: 'analytics:',
  BOOKING: 'booking:',
};

// ─── OTP ───────────────────────────────────────────────────────────────────

export async function setOtp(phone: string, otp: string): Promise<void> {
  const key = `${PREFIX.OTP}${phone}`;
  await getRedisClient().setex(key, env.redis.ttl.otp, otp);
}

export async function getOtp(phone: string): Promise<string | null> {
  return getRedisClient().get(`${PREFIX.OTP}${phone}`);
}

export async function deleteOtp(phone: string): Promise<void> {
  await getRedisClient().del(`${PREFIX.OTP}${phone}`);
}

// ─── Sessions ──────────────────────────────────────────────────────────────

export async function setSession(
  userId: string,
  deviceId: string,
  payload: object,
): Promise<void> {
  const key = `${PREFIX.SESSION}${userId}:${deviceId}`;
  await getRedisClient().setex(
    key,
    env.redis.ttl.session,
    JSON.stringify(payload),
  );
}

export async function getSession(
  userId: string,
  deviceId: string,
): Promise<Record<string, unknown> | null> {
  const raw = await getRedisClient().get(
    `${PREFIX.SESSION}${userId}:${deviceId}`,
  );
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
}

export async function deleteSession(
  userId: string,
  deviceId: string,
): Promise<void> {
  await getRedisClient().del(`${PREFIX.SESSION}${userId}:${deviceId}`);
}

export async function deleteAllSessions(userId: string): Promise<void> {
  const keys = await getRedisClient().keys(`${PREFIX.SESSION}${userId}:*`);
  if (keys.length) await getRedisClient().del(...keys);
}

// ─── Seat Locking ──────────────────────────────────────────────────────────

export async function lockSeats(
  busId: string,
  seats: string[],
  userId: string,
): Promise<boolean> {
  const redis = getRedisClient();
  const pipeline = redis.pipeline();
  const lockKey = `${PREFIX.SEAT_LOCK}${busId}:${seats.sort().join(',')}`;

  const existing = await redis.get(lockKey);
  if (existing && existing !== userId) return false;

  pipeline.setex(lockKey, env.redis.ttl.seatLock, userId);
  await pipeline.exec();
  return true;
}

export async function unlockSeats(
  busId: string,
  seats: string[],
): Promise<void> {
  const lockKey = `${PREFIX.SEAT_LOCK}${busId}:${seats.sort().join(',')}`;
  await getRedisClient().del(lockKey);
}

export async function isSeatLocked(
  busId: string,
  seat: string,
): Promise<boolean> {
  const keys = await getRedisClient().keys(
    `${PREFIX.SEAT_LOCK}${busId}:*${seat}*`,
  );
  return keys.length > 0;
}

// ─── Generic Cache ─────────────────────────────────────────────────────────

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds?: number,
): Promise<void> {
  const ttl = ttlSeconds ?? env.redis.ttl.cache;
  await getRedisClient().setex(
    `${PREFIX.CACHE}${key}`,
    ttl,
    JSON.stringify(value),
  );
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await getRedisClient().get(`${PREFIX.CACHE}${key}`);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function cacheDel(key: string): Promise<void> {
  await getRedisClient().del(`${PREFIX.CACHE}${key}`);
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  const keys = await getRedisClient().keys(`${PREFIX.CACHE}${pattern}`);
  if (keys.length) await getRedisClient().del(...keys);
}

// ─── Analytics Cache ───────────────────────────────────────────────────────

export async function incrementAnalytic(
  tenantId: string,
  metric: string,
): Promise<void> {
  const key = `${PREFIX.ANALYTICS}${tenantId}:${metric}`;
  await getRedisClient().incr(key);
  await getRedisClient().expire(key, 86400);
}

export async function getAnalytics(
  tenantId: string,
): Promise<Record<string, number>> {
  const keys = await getRedisClient().keys(`${PREFIX.ANALYTICS}${tenantId}:*`);
  if (!keys.length) return {};
  const values = await getRedisClient().mget(...keys);
  return Object.fromEntries(
    keys.map((k, i) => [k.replace(`${PREFIX.ANALYTICS}${tenantId}:`, ''), Number(values[i] ?? 0)]),
  );
}
