import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

// Prevent actual Redis connections in unit tests
jest.mock('../src/core/redis/redis.client', () => ({
  getRedisClient: jest.fn().mockReturnValue({
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    incr: jest.fn(),
    expire: jest.fn(),
    mget: jest.fn().mockResolvedValue([]),
    pipeline: jest.fn().mockReturnValue({ setex: jest.fn(), exec: jest.fn() }),
    connect: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  }),
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn(),
}));
