import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/db.helper';
import { createTestUser, generateToken } from '../helpers/auth.helper';
import { Role } from '../../src/core/types';
import { Bus } from '../../src/modules/bus/bus.model';
import { Booking } from '../../src/modules/booking/booking.model';

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

async function setupBus() {
  const op = await createTestUser({ role: Role.OPERATOR, phone: '9876543250' });
  return Bus.create({
    busNo: 'TEST001',
    operatorId: op._id,
    vehicleType: 'seater',
    route: { from: 'Delhi', to: 'Agra', stops: [] },
    departAt: new Date(Date.now() + 86400000),
    arriveAt: new Date(Date.now() + 86400000 + 3600000),
    totalSeats: 4,
    baseFare: 250,
    seats: [
      { seatNo: '01', status: 'available', fare: 250 },
      { seatNo: '02', status: 'available', fare: 250 },
      { seatNo: '03', status: 'booked', fare: 250 },
    ],
    status: 'active',
  });
}

describe('POST /api/bookings', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/api/bookings').send({});
    expect(res.status).toBe(401);
  });

  it('creates a booking for authenticated user', async () => {
    const bus = await setupBus();
    const user = await createTestUser({ phone: '9876543251' });
    const token = generateToken(user._id.toString(), Role.USER, TEST_JWT_SECRET);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        busId: bus._id.toString(),
        travelDate: new Date(Date.now() + 86400000).toISOString(),
        from: 'Delhi',
        to: 'Agra',
        passengers: [
          { name: 'Alice Smith', age: 28, gender: 'female', seatNo: '01' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.booking.status).toBe('pending');
    expect(res.body.data.booking.totalFare).toBe(250);
  });

  it('returns 409 for unavailable seat', async () => {
    const bus = await setupBus();
    const user = await createTestUser({ phone: '9876543252' });
    const token = generateToken(user._id.toString(), Role.USER, TEST_JWT_SECRET);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        busId: bus._id.toString(),
        travelDate: new Date(Date.now() + 86400000).toISOString(),
        from: 'Delhi',
        to: 'Agra',
        passengers: [
          { name: 'Bob', age: 35, gender: 'male', seatNo: '03' },
        ],
      });

    expect(res.status).toBe(409);
  });
});

describe('GET /api/bookings/my', () => {
  it('returns user bookings', async () => {
    const bus = await setupBus();
    const user = await createTestUser({ phone: '9876543253' });
    const token = generateToken(user._id.toString(), Role.USER, TEST_JWT_SECRET);

    await Booking.create({
      userId: user._id,
      busId: bus._id,
      travelDate: new Date(Date.now() + 86400000),
      from: 'Delhi',
      to: 'Agra',
      passengers: [{ name: 'Charlie', age: 22, gender: 'male', seatNo: '02' }],
      totalFare: 250,
      status: 'confirmed',
    });

    const res = await request(app)
      .get('/api/bookings/my')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toHaveLength(1);
  });
});

describe('PATCH /api/bookings/:id/cancel', () => {
  it('allows user to cancel own booking', async () => {
    const bus = await setupBus();
    const user = await createTestUser({ phone: '9876543254' });
    const token = generateToken(user._id.toString(), Role.USER, TEST_JWT_SECRET);

    const booking = await Booking.create({
      userId: user._id,
      busId: bus._id,
      travelDate: new Date(Date.now() + 86400000),
      from: 'Delhi',
      to: 'Agra',
      passengers: [{ name: 'Dave', age: 40, gender: 'male', seatNo: '01' }],
      totalFare: 250,
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/bookings/${booking._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Test cancellation' });

    expect(res.status).toBe(200);
    expect(res.body.data.booking.status).toBe('cancelled');
  });
});
