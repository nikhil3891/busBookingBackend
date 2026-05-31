import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/db.helper';
import { createTestUser, generateToken } from '../helpers/auth.helper';
import { Role } from '../../src/core/types';
import { Bus } from '../../src/modules/bus/bus.model';

jest.mock('../../src/core/redis/redis.service', () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn(),
  cacheDel: jest.fn(),
  cacheDelPattern: jest.fn(),
  lockSeats: jest.fn().mockResolvedValue(true),
  unlockSeats: jest.fn(),
}));

jest.mock('../../src/jobs/queues/email.queue', () => ({
  emailQueue: { add: jest.fn() },
}));

const TEST_JWT_SECRET = 'test_secret_key_for_testing';
process.env['JWT_SECRET'] = TEST_JWT_SECRET;

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

const tomorrow = new Date(Date.now() + 86400000).toISOString();
const afterTomorrow = new Date(Date.now() + 86400000 + 7200000).toISOString();

const busPayload = {
  busNo: 'KA01B1234',
  vehicleType: 'seater',
  route: { from: 'Bangalore', to: 'Mysore', stops: [] },
  departAt: tomorrow,
  arriveAt: afterTomorrow,
  totalSeats: 40,
  baseFare: 300,
  amenities: ['ac'],
};

describe('GET /api/buses', () => {
  it('returns 400 when required query params are missing', async () => {
    const res = await request(app).get('/api/buses');
    expect(res.status).toBe(400);
  });

  it('returns bus list with valid query', async () => {
    const op = await createTestUser({ role: Role.OPERATOR });
    await Bus.create({
      ...busPayload,
      operatorId: op._id,
      seats: [],
    });

    const dateStr = new Date(Date.now() + 86400000).toISOString().split('T')[0]!;
    const res = await request(app).get(
      `/api/buses?from=Bangalore&to=Mysore&date=${dateStr}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data).toBeInstanceOf(Array);
  });
});

describe('POST /api/buses', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/api/buses').send(busPayload);
    expect(res.status).toBe(401);
  });

  it('returns 403 when regular user tries to create bus', async () => {
    const user = await createTestUser({ role: Role.USER });
    const token = generateToken(user._id.toString(), Role.USER, TEST_JWT_SECRET);

    const res = await request(app)
      .post('/api/buses')
      .set('Authorization', `Bearer ${token}`)
      .send(busPayload);

    expect(res.status).toBe(403);
  });

  it('creates bus when operator is authenticated', async () => {
    const op = await createTestUser({ role: Role.OPERATOR });
    const token = generateToken(op._id.toString(), Role.OPERATOR, TEST_JWT_SECRET);

    const res = await request(app)
      .post('/api/buses')
      .set('Authorization', `Bearer ${token}`)
      .send(busPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bus.busNo).toBe('KA01B1234');
    expect(res.body.data.bus.seats).toHaveLength(40);
  });
});

describe('GET /api/buses/:id', () => {
  it('returns bus by id', async () => {
    const op = await createTestUser({ role: Role.OPERATOR });
    const bus = await Bus.create({ ...busPayload, operatorId: op._id, seats: [] });

    const res = await request(app).get(`/api/buses/${bus._id.toString()}`);
    expect(res.status).toBe(200);
    expect(res.body.data.bus.busNo).toBe('KA01B1234');
  });

  it('returns 404 for non-existent bus', async () => {
    const res = await request(app).get('/api/buses/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/buses/:id', () => {
  it('allows admin to delete bus', async () => {
    const admin = await createTestUser({ role: Role.ADMIN });
    const op = await createTestUser({ role: Role.OPERATOR, phone: '9876543231' });
    const token = generateToken(admin._id.toString(), Role.ADMIN, TEST_JWT_SECRET);
    const bus = await Bus.create({ ...busPayload, busNo: 'TO_DELETE', operatorId: op._id, seats: [] });

    const res = await request(app)
      .delete(`/api/buses/${bus._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(await Bus.findById(bus._id)).toBeNull();
  });
});
