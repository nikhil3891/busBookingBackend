import { env } from '../config/env.config';

/**
 * BullMQ requires its own ioredis connection options object,
 * not a shared ioredis client instance, to avoid version conflicts
 * with the ioredis version bundled inside bullmq.
 */
export function getBullMQConnection() {
  return {
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}
