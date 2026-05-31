import { authService } from '../auth.service';
import { User } from '../../user/user.model';
import * as redisService from '../../../core/redis/redis.service';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../../../tests/helpers/db.helper';
import { BadRequestError, UnauthorizedError } from '../../../core/errors/AppError';

// Mock Redis service
jest.mock('../../../core/redis/redis.service', () => ({
  setOtp: jest.fn(),
  getOtp: jest.fn(),
  deleteOtp: jest.fn(),
  setSession: jest.fn(),
  deleteAllSessions: jest.fn(),
}));

// Mock job queues
jest.mock('../../../jobs/queues/email.queue', () => ({
  emailQueue: { add: jest.fn() },
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

describe('AuthService', () => {
  describe('sendOtp()', () => {
    it('stores OTP in Redis and returns success message', async () => {
      const setOtpMock = jest.spyOn(redisService, 'setOtp').mockResolvedValue();

      const result = await authService.sendOtp({ phone: '9876543210' });

      expect(setOtpMock).toHaveBeenCalledWith('9876543210', expect.stringMatching(/^\d{6}$/));
      expect(result.message).toContain('OTP sent');
    });
  });

  describe('verifyOtp()', () => {
    it('creates a new user on first OTP verification', async () => {
      jest.spyOn(redisService, 'getOtp').mockResolvedValue('123456');
      jest.spyOn(redisService, 'deleteOtp').mockResolvedValue();

      const result = await authService.verifyOtp({
        phone: '9876543210',
        otp: '123456',
      });

      expect(result.user.phone).toBe('9876543210');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(result.profileRequired).toBe(true);

      const savedUser = await User.findOne({ phone: '9876543210' });
      expect(savedUser).not.toBeNull();
    });

    it('returns existing user on second login', async () => {
      await User.create({ phone: '9876543211', isVerified: true });

      jest.spyOn(redisService, 'getOtp').mockResolvedValue('654321');
      jest.spyOn(redisService, 'deleteOtp').mockResolvedValue();

      const result = await authService.verifyOtp({
        phone: '9876543211',
        otp: '654321',
      });

      expect(result.user.phone).toBe('9876543211');
      const count = await User.countDocuments({ phone: '9876543211' });
      expect(count).toBe(1);
    });

    it('throws BadRequestError on wrong OTP', async () => {
      jest.spyOn(redisService, 'getOtp').mockResolvedValue('111111');

      await expect(
        authService.verifyOtp({ phone: '9876543210', otp: '999999' }),
      ).rejects.toThrow(BadRequestError);
    });

    it('throws BadRequestError when OTP is expired (null from Redis)', async () => {
      jest.spyOn(redisService, 'getOtp').mockResolvedValue(null);

      await expect(
        authService.verifyOtp({ phone: '9876543210', otp: '123456' }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('refreshAccessToken()', () => {
    it('throws UnauthorizedError on invalid refresh token', async () => {
      await expect(
        authService.refreshAccessToken({
          userId: 'someId',
          refreshToken: 'invalid-token',
        }),
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('adminLogin()', () => {
    it('throws UnauthorizedError for non-existent admin', async () => {
      await expect(
        authService.adminLogin({ phone: '9999999999', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws ForbiddenError for non-admin user', async () => {
      const user = await User.create({
        phone: '9999999998',
        password: 'correct_password',
        role: 'user',
        isVerified: true,
        profileCompleted: true,
      });

      await expect(
        authService.adminLogin({ phone: '9999999998', password: 'correct_password' }),
      ).rejects.toThrow();
    });
  });

  describe('completeRegistration()', () => {
    it('updates user profile fields', async () => {
      await User.create({ phone: '9876543213' });

      await authService.completeRegistration({
        phone: '9876543213',
        fullName: 'John Doe',
        email: 'john@example.com',
        gender: 'male',
      });

      const updated = await User.findOne({ phone: '9876543213' });
      expect(updated?.fullName).toBe('John Doe');
      expect(updated?.email).toBe('john@example.com');
      expect(updated?.profileCompleted).toBe(true);
    });
  });
});
