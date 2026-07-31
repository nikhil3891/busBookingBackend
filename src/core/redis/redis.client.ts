import Redis from 'ioredis';
import { env } from '../config/env.config';
import { logger } from '../logger/logger';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  redisClient = new Redis({
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
    enableOfflineQueue: true,
    connectTimeout: 2000,
    retryStrategy: (times: number) => Math.min(times * 200, 2000),
  });

  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('ready', () => logger.info('Redis ready'));
  redisClient.on('error', (err) => logger.error('Redis error', { err }));
  redisClient.on('close', () => logger.warn('Redis connection closed'));

  return redisClient;
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();

  try {
    await client.connect();
  } catch (err) {
    logger.warn('Redis unavailable during startup; continuing without Redis', { err });
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
