import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/db.helper';
import { User } from '../../src/modules/user/user.model';
import * as redisService from '../../src/core/redis/redis.service';

jest.mock('../../src/core/redis/redis.service', () => ({
  setOtp: jest.fn(),
  getOtp: jest.fn(),
  deleteOtp: jest.fn(),
  setSession: jest.fn(),
  getSession: jest.fn(),
  deleteSession: jest.fn(),
  deleteAllSessions: jest.fn(),
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn(),
  cacheDel: jest.fn(),
  cacheDelPattern: jest.fn(),
  lockSeats: jest.fn().mockResolvedValue(true),
  unlockSeats: jest.fn(),
  incrementAnalytic: jest.fn(),
}));

jest.mock('../../src/jobs/queues/email.queue', () => ({
  emailQueue: { add: jest.fn() },
}));
jest.mock('../../src/jobs/queues/sms.queue', () => ({
  smsQueue: { add: jest.fn() },
}));

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearTestDB();
  jest.clearAllMocks();
});

describe('POST /api/auth/send-otp', () => {
  it('returns 200 and sends OTP', async () => {
    jest.spyOn(redisService, 'setOtp').mockResolvedValue();

    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '9876543210' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(redisService.setOtp).toHaveBeenCalledWith('9876543210', expect.stringMatching(/^\d{6}$/));
  });

  it('returns 400 for invalid phone number', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '1234' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for missing phone', async () => {
    const res = await request(app).post('/api/auth/send-otp').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/verify-otp', () => {
  it('creates a new user and returns tokens', async () => {
    jest.spyOn(redisService, 'getOtp').mockResolvedValue('123456');
    jest.spyOn(redisService, 'deleteOtp').mockResolvedValue();

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: '9876543210', otp: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
    expect(res.body.data.profileRequired).toBe(true);
  });

  it('returns 400 for wrong OTP', async () => {
    jest.spyOn(redisService, 'getOtp').mockResolvedValue('111111');

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: '9876543210', otp: '999999' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_OTP');
  });
});

describe('POST /api/auth/complete-registration', () => {
  it('completes profile and sets profileCompleted=true', async () => {
    jest.spyOn(redisService, 'getOtp').mockResolvedValue('123456');
    jest.spyOn(redisService, 'deleteOtp').mockResolvedValue();

    // First: verify OTP to create user
    await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: '9876543210', otp: '123456' });

    const res = await request(app)
      .post('/api/auth/complete-registration')
      .send({
        phone: '9876543210',
        fullName: 'John Doe',
        email: 'john@example.com',
        gender: 'male',
      });

    expect(res.status).toBe(200);

    const user = await User.findOne({ phone: '9876543210' });
    expect(user?.fullName).toBe('John Doe');
    expect(user?.profileCompleted).toBe(true);
  });
});

describe('POST /api/auth/admin/login', () => {
  it('returns 401 for non-existent admin', async () => {
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({ phone: '9999999999', password: 'wrong' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/health', () => {
  it('returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
