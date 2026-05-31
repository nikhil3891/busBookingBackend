import { bookingService } from '../booking.service';
import { Bus } from '../../bus/bus.model';
import { Booking } from '../booking.model';
import { User } from '../../user/user.model';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../../../tests/helpers/db.helper';
import { BadRequestError, ConflictError, NotFoundError } from '../../../core/errors/AppError';
import * as redisService from '../../../core/redis/redis.service';

jest.mock('../../../core/redis/redis.service', () => ({
  lockSeats: jest.fn().mockResolvedValue(true),
  unlockSeats: jest.fn().mockResolvedValue(undefined),
  isSeatLocked: jest.fn().mockResolvedValue(false),
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
  cacheDel: jest.fn().mockResolvedValue(undefined),
  cacheDelPattern: jest.fn().mockResolvedValue(undefined),
}));

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

async function createTestBus(overrides = {}) {
  const user = await User.create({ phone: '9876543220', role: 'operator', isVerified: true });
  return Bus.create({
    busNo: 'KA01F1234',
    operatorId: user._id,
    vehicleType: 'seater',
    route: { from: 'Bangalore', to: 'Mysore', stops: [] },
    departAt: new Date(Date.now() + 86400000),
    arriveAt: new Date(Date.now() + 86400000 + 3600000),
    totalSeats: 40,
    baseFare: 300,
    seats: [
      { seatNo: '01', status: 'available', fare: 300 },
      { seatNo: '02', status: 'available', fare: 300 },
      { seatNo: '03', status: 'booked', fare: 300 },
    ],
    status: 'active',
    ...overrides,
  });
}

async function createTestUser() {
  return User.create({ phone: '9876543221', isVerified: true, profileCompleted: true });
}

describe('BookingService', () => {
  describe('createBooking()', () => {
    it('creates a booking and locks seats', async () => {
      const bus = await createTestBus();
      const user = await createTestUser();

      const booking = await bookingService.createBooking(
        {
          busId: bus._id.toString(),
          travelDate: new Date(Date.now() + 86400000).toISOString(),
          from: 'Bangalore',
          to: 'Mysore',
          passengers: [
            { name: 'Alice', age: 25, gender: 'female', seatNo: '01' },
          ],
        },
        user._id.toString(),
      );

      expect(booking.status).toBe('pending');
      expect(booking.passengers).toHaveLength(1);
      expect(booking.totalFare).toBe(300);
      expect(redisService.lockSeats).toHaveBeenCalled();
    });

    it('throws NotFoundError for non-existent bus', async () => {
      const user = await createTestUser();
      await expect(
        bookingService.createBooking(
          {
            busId: '507f1f77bcf86cd799439011',
            travelDate: new Date().toISOString(),
            from: 'A',
            to: 'B',
            passengers: [{ name: 'Alice', age: 25, gender: 'female', seatNo: '01' }],
          },
          user._id.toString(),
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError for booked seat', async () => {
      const bus = await createTestBus();
      const user = await createTestUser();

      await expect(
        bookingService.createBooking(
          {
            busId: bus._id.toString(),
            travelDate: new Date(Date.now() + 86400000).toISOString(),
            from: 'Bangalore',
            to: 'Mysore',
            passengers: [{ name: 'Bob', age: 30, gender: 'male', seatNo: '03' }],
          },
          user._id.toString(),
        ),
      ).rejects.toThrow(ConflictError);
    });

    it('throws BadRequestError for inactive bus', async () => {
      const bus = await createTestBus({ status: 'cancelled' });
      const user = await createTestUser();

      await expect(
        bookingService.createBooking(
          {
            busId: bus._id.toString(),
            travelDate: new Date().toISOString(),
            from: 'Bangalore',
            to: 'Mysore',
            passengers: [{ name: 'Carol', age: 28, gender: 'female', seatNo: '01' }],
          },
          user._id.toString(),
        ),
      ).rejects.toThrow(BadRequestError);
    });

    it('throws ConflictError when seat lock fails (concurrent booking)', async () => {
      jest.spyOn(redisService, 'lockSeats').mockResolvedValueOnce(false);

      const bus = await createTestBus();
      const user = await createTestUser();

      await expect(
        bookingService.createBooking(
          {
            busId: bus._id.toString(),
            travelDate: new Date(Date.now() + 86400000).toISOString(),
            from: 'Bangalore',
            to: 'Mysore',
            passengers: [{ name: 'Dave', age: 22, gender: 'male', seatNo: '01' }],
          },
          user._id.toString(),
        ),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('cancelBooking()', () => {
    it('cancels a pending booking', async () => {
      const bus = await createTestBus();
      const user = await createTestUser();

      const booking = await Booking.create({
        userId: user._id,
        busId: bus._id,
        travelDate: new Date(Date.now() + 86400000),
        from: 'Bangalore',
        to: 'Mysore',
        passengers: [{ name: 'Eve', age: 30, gender: 'female', seatNo: '01' }],
        totalFare: 300,
        status: 'pending',
      });

      const cancelled = await bookingService.cancelBooking(
        booking._id.toString(),
        user._id.toString(),
        'Changed plans',
      );

      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.cancellationReason).toBe('Changed plans');
    });

    it('prevents cancelling another user booking', async () => {
      const bus = await createTestBus();
      const user1 = await createTestUser();
      const user2 = await User.create({ phone: '9876543222', isVerified: true });

      const booking = await Booking.create({
        userId: user1._id,
        busId: bus._id,
        travelDate: new Date(Date.now() + 86400000),
        from: 'Bangalore',
        to: 'Mysore',
        passengers: [{ name: 'Frank', age: 35, gender: 'male', seatNo: '02' }],
        totalFare: 300,
        status: 'pending',
      });

      await expect(
        bookingService.cancelBooking(booking._id.toString(), user2._id.toString()),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
