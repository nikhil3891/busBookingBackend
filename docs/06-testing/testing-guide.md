# Testing Guide

## Setup

Tests use:
- **Jest** + **ts-jest** — test runner and TypeScript support
- **supertest** — HTTP integration testing
- **mongodb-memory-server** — in-memory MongoDB (no external DB needed)
- **jest.mock()** — mock Redis, BullMQ queues

```bash
pnpm test              # Run all tests
pnpm test:unit         # Unit tests only (src/**/__tests__/)
pnpm test:e2e          # E2E API tests (tests/e2e/)
pnpm test:coverage     # With coverage report
pnpm test:watch        # Watch mode
```

---

## Test Structure

```
src/
└── modules/
    ├── auth/__tests__/auth.service.test.ts
    ├── bus/__tests__/bus.service.test.ts
    └── booking/__tests__/booking.service.test.ts

tests/
├── setup.ts              # Global mocks (Redis)
├── helpers/
│   ├── db.helper.ts      # connectTestDB, disconnectTestDB, clearTestDB
│   └── auth.helper.ts    # createTestUser, generateToken
└── e2e/
    ├── auth.e2e.test.ts
    ├── bus.e2e.test.ts
    └── booking.e2e.test.ts
```

---

## Unit Test Pattern

```typescript
// 1. Mock external dependencies
jest.mock('../../../core/redis/redis.service', () => ({
  getOtp: jest.fn(),
  setOtp: jest.fn(),
  deleteOtp: jest.fn(),
}));

jest.mock('../../../jobs/queues/email.queue', () => ({
  emailQueue: { add: jest.fn() },
}));

// 2. Use in-memory MongoDB
beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => {
  await clearTestDB();
  jest.clearAllMocks();
});

// 3. Test service methods directly
it('creates a booking', async () => {
  const result = await bookingService.createBooking(dto, userId);
  expect(result.status).toBe('pending');
});
```

---

## E2E Test Pattern

```typescript
// Use supertest to make real HTTP requests to the Express app
const res = await request(app)
  .post('/api/bookings')
  .set('Authorization', `Bearer ${token}`)
  .send(payload);

expect(res.status).toBe(201);
expect(res.body.success).toBe(true);
```

---

## Writing New Tests

### For a new service method:
1. Add test in `src/modules/<name>/__tests__/<name>.service.test.ts`
2. Mock all external deps (Redis, queues, other services)
3. Test happy path + all error paths
4. Use `clearTestDB()` in `afterEach` to avoid test pollution

### For a new API endpoint:
1. Add test in `tests/e2e/<name>.e2e.test.ts`
2. Test: unauthenticated (401), wrong role (403), validation error (400), success (200/201), not found (404)

---

## Coverage Goals

| Module | Target |
|--------|--------|
| Auth Service | 90%+ |
| Booking Service | 85%+ |
| Bus Service | 85%+ |
| Payment Service | 80%+ |
| E2E (auth, bus, booking) | All happy + error paths |

---

## Environment for Tests

Create `.env.test`:
```env
NODE_ENV=test
JWT_SECRET=test_secret_key_for_testing
MONGO_URI=mongodb://localhost:27017/test  # overridden by memory server
```

The `tests/setup.ts` file auto-mocks the Redis client so unit/e2e tests never need a real Redis instance.
