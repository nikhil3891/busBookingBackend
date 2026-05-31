import { busService } from '../bus.service';
import { Bus } from '../bus.model';
import { User } from '../../user/user.model';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../../../tests/helpers/db.helper';
import { NotFoundError, BadRequestError } from '../../../core/errors/AppError';

jest.mock('../../../core/redis/redis.service', () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
  cacheDel: jest.fn().mockResolvedValue(undefined),
  cacheDelPattern: jest.fn().mockResolvedValue(undefined),
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

async function createOperator() {
  return User.create({ phone: '9876543230', role: 'operator', isVerified: true });
}

describe('BusService', () => {
  describe('create()', () => {
    it('creates a bus with auto-generated seats when none provided', async () => {
      const op = await createOperator();
      const tomorrow = new Date(Date.now() + 86400000);
      const afterTomorrow = new Date(Date.now() + 86400000 + 7200000);

      const bus = await busService.create(
        {
          busNo: 'TN01AB1234',
          vehicleType: 'seater',
          route: { from: 'Chennai', to: 'Coimbatore', stops: [] },
          departAt: tomorrow.toISOString(),
          arriveAt: afterTomorrow.toISOString(),
          totalSeats: 40,
          baseFare: 500,
          amenities: ['wifi', 'ac'],
        },
        op._id.toString(),
      );

      expect(bus.seats).toHaveLength(40);
      expect(bus.seats[0]!.seatNo).toBe('01');
      expect(bus.seats[0]!.fare).toBe(500);
      expect(bus.seats[0]!.status).toBe('available');
    });

    it('throws when arriveAt is before departAt', async () => {
      const op = await createOperator();
      const now = new Date();

      await expect(
        busService.create(
          {
            busNo: 'TN01AB5678',
            vehicleType: 'sleeper',
            route: { from: 'A', to: 'B', stops: [] },
            departAt: new Date(now.getTime() + 7200000).toISOString(),
            arriveAt: new Date(now.getTime() + 3600000).toISOString(),
            totalSeats: 20,
            baseFare: 300,
            amenities: [],
          },
          op._id.toString(),
        ),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('getById()', () => {
    it('returns bus by id', async () => {
      const op = await createOperator();
      const bus = await Bus.create({
        busNo: 'KA01X9999',
        operatorId: op._id,
        vehicleType: 'ac_seater',
        route: { from: 'Bangalore', to: 'Hyderabad', stops: [] },
        departAt: new Date(Date.now() + 86400000),
        arriveAt: new Date(Date.now() + 86400000 + 5 * 3600000),
        totalSeats: 30,
        baseFare: 800,
        seats: [],
        status: 'active',
      });

      const found = await busService.getById(bus._id.toString());
      expect(found._id.toString()).toBe(bus._id.toString());
    });

    it('throws NotFoundError for invalid id', async () => {
      await expect(busService.getById('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundError);
    });
  });

  describe('search()', () => {
    it('returns matching buses', async () => {
      const op = await createOperator();
      const tomorrow = new Date(Date.now() + 86400000);
      await Bus.create({
        busNo: 'MH01Y1111',
        operatorId: op._id,
        vehicleType: 'seater',
        route: { from: 'Mumbai', to: 'Pune', stops: [] },
        departAt: tomorrow,
        arriveAt: new Date(tomorrow.getTime() + 3600000),
        totalSeats: 40,
        baseFare: 400,
        seats: [],
        status: 'active',
      });

      const dateStr = tomorrow.toISOString().split('T')[0]!;
      const result = await busService.search({
        from: 'Mumbai',
        to: 'Pune',
        date: dateStr,
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('remove()', () => {
    it('deletes bus', async () => {
      const op = await createOperator();
      const bus = await Bus.create({
        busNo: 'GJ01Z2222',
        operatorId: op._id,
        vehicleType: 'sleeper',
        route: { from: 'Ahmedabad', to: 'Surat', stops: [] },
        departAt: new Date(Date.now() + 86400000),
        arriveAt: new Date(Date.now() + 86400000 + 2 * 3600000),
        totalSeats: 30,
        baseFare: 350,
        seats: [],
        status: 'active',
      });

      await busService.remove(bus._id.toString());
      const found = await Bus.findById(bus._id);
      expect(found).toBeNull();
    });
  });
});
