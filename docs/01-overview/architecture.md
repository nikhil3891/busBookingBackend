# Architecture — Bus Booking Backend

## Overview

This backend follows a **Modular Monolith** architecture pattern — a single deployable unit organized into cohesive, loosely-coupled domain modules with clear boundaries. This gives the team:

- Fast local development (no network hops between services)
- Organized code that can be extracted into microservices when scale demands it
- Shared infrastructure (DB, Redis, logger) without duplication

---

## Directory Structure

```
src/
├── core/                         # Cross-cutting concerns (shared by all modules)
│   ├── config/
│   │   ├── env.config.ts         # All env var validation and defaults
│   │   └── db.config.ts          # MongoDB connection
│   ├── errors/
│   │   ├── AppError.ts           # Custom error hierarchy
│   │   └── errorHandler.ts       # Global Express error handler
│   ├── logger/
│   │   └── logger.ts             # Winston structured logger
│   ├── redis/
│   │   ├── redis.client.ts       # ioredis singleton
│   │   └── redis.service.ts      # OTP, sessions, caching, seat locking
│   ├── events/
│   │   ├── event.bus.ts          # Typed EventEmitter (domain event bus)
│   │   └── event.types.ts        # All domain event enums + payload types
│   ├── middlewares/
│   │   ├── auth.middleware.ts    # authenticate() + authorize() + requireRoles()
│   │   ├── tenant.middleware.ts  # Tenant ID extraction (header/subdomain/JWT)
│   │   ├── rate-limit.middleware.ts  # global, auth, strict limiters
│   │   └── validate.middleware.ts    # Zod validation middleware
│   └── types/
│       └── index.ts              # Role, Permission, RBAC map, shared types
│
├── modules/                      # Business domain modules
│   ├── auth/                     # OTP flow, JWT, admin auth
│   ├── user/                     # User profile, admin user management
│   ├── admin/                    # Admin-specific operations
│   ├── bus/                      # Bus CRUD, search, seat management
│   ├── booking/                  # Booking creation, confirmation, cancellation
│   ├── payment/                  # Payment initiation, verification, refunds
│   ├── notification/             # In-app + multi-channel notifications
│   └── tenant/                   # Tenant management (SaaS)
│
├── jobs/                         # BullMQ job infrastructure
│   ├── queues/                   # Queue definitions (email, sms, invoice, analytics)
│   ├── workers/                  # Worker processors (run jobs)
│   └── scheduler.ts              # Cron-based job scheduling
│
├── socket/
│   └── socket.gateway.ts         # Socket.IO server + event bridges
│
├── passport/
│   └── jwt.strategy.ts           # Passport JWT strategy
│
├── routes/
│   └── index.ts                  # Central route registration
│
├── app.ts                        # Express app setup
└── server.ts                     # Bootstrap (DB, Redis, workers, HTTP server)
```

---

## Module Structure (per domain)

Each module follows this consistent internal structure:

```
modules/<name>/
├── <name>.model.ts         # Mongoose schema + Document interface
├── <name>.repository.ts    # DB queries (optional for complex modules)
├── <name>.service.ts       # Business logic
├── <name>.controller.ts    # HTTP handlers (thin, delegates to service)
├── <name>.routes.ts        # Express router + middleware composition
├── <name>.validation.ts    # Zod schemas for request validation
├── <name>.types.ts         # TypeScript types/interfaces for module
└── __tests__/
    └── <name>.service.test.ts  # Unit tests
```

---

## Request Flow

```
HTTP Request
    │
    ▼
Express App (app.ts)
    │
    ├── helmet()             ← Security headers
    ├── cors()               ← CORS policy
    ├── hpp()                ← HTTP Parameter Pollution protection
    ├── express.json()       ← Body parsing
    ├── morgan()             ← Request logging
    ├── passport.initialize() ← Auth strategy registration
    │
    ▼
globalRateLimiter            ← Redis-backed rate limiting (per IP)
    │
    ▼
/api router (routes/index.ts)
    │
    ├── tenantMiddleware()   ← Extract X-Tenant-Id / subdomain
    │
    ├── /auth               ← authRoutes
    │   ├── authRateLimiter  ← OTP-specific rate limit
    │   ├── validate(schema) ← Zod validation
    │   └── authController
    │
    ├── /users              ← userRoutes
    │   ├── authenticate()   ← passport-jwt
    │   ├── authorize()      ← Permission check
    │   └── userController
    │
    └── ...other modules...
         │
         ▼
    Module Controller
         │
         ▼
    Module Service          ← Business logic, throws AppError
         │
         ├── Repository / Model  ← DB operations
         ├── Redis Service       ← Cache / lock operations
         └── Event Bus           ← Emit domain events
                │
                ▼
           Event Listeners  ← BullMQ job queue, Socket.IO bridge
                │
                ▼
            Workers         ← Email, SMS, Invoice PDF, Analytics
    │
    ▼
errorHandler()               ← Centralized error formatting
    │
    ▼
HTTP Response
```

---

## Technology Choices

| Concern | Choice | Reason |
|---------|--------|--------|
| Runtime | Node.js 22 | LTS, async I/O |
| Language | TypeScript (strict) | Type safety, better IDE support |
| Framework | Express 5 | Mature, minimal, great ecosystem |
| Database | MongoDB + Mongoose | Flexible schema, nested documents |
| Cache / Pub-Sub | Redis (ioredis) | OTP, sessions, seat locking, caching |
| Job Queues | BullMQ | Built on Redis, retries, monitoring |
| Real-time | Socket.IO | WebSocket + polling fallback |
| Validation | Zod | Type-safe schema validation |
| Auth | Passport-JWT | Battle-tested JWT strategy |
| Logging | Winston | Structured JSON logs in prod |
| Password Hashing | bcrypt | Industry standard |
| PDF Generation | pdfkit | Serverside invoice PDFs |
| Email | Nodemailer | SMTP, flexible |
| Testing | Jest + ts-jest + supertest | Unit + E2E |
| Test DB | mongodb-memory-server | In-memory MongoDB for tests |
| Container | Docker + docker-compose | Dev/prod parity |

---

## Module Dependency Diagram

```
                    ┌─────────────┐
                    │    core/    │
                    │  config     │
                    │  errors     │
                    │  logger     │
                    │  redis      │
                    │  events     │
                    │  middleware │
                    │  types      │
                    └──────┬──────┘
                           │ (all modules depend on core)
         ┌─────────────────┼──────────────────────┐
         │                 │                      │
    ┌────▼────┐      ┌──────▼──────┐      ┌───────▼──────┐
    │  auth   │      │    user     │      │    tenant    │
    └────┬────┘      └──────┬──────┘      └───────┬──────┘
         │                 │                      │
    ┌────▼────────────────▼──────────────────────▼─────┐
    │                    bus                            │
    └────────────────────┬──────────────────────────────┘
                         │
                   ┌─────▼──────┐
                   │  booking   │─────► payment
                   └─────┬──────┘          │
                         │                 │
                   ┌─────▼──────┐          │
                   │notification│◄─────────┘
                   └────────────┘
                         │
                   ┌─────▼──────────────────────────┐
                   │  jobs/ (queues + workers)       │
                   │  socket/ (Socket.IO gateway)    │
                   └─────────────────────────────────┘
```

---

## Event-Driven Communication

Modules communicate **internally** via the typed `EventBus` (Node.js EventEmitter).

This means:
- No direct cross-module service calls (e.g., `bookingService` doesn't import `emailService`)
- The booking module emits `BOOKING_CREATED`, and a listener in the jobs module queues the email
- Socket.IO bridges domain events to WebSocket clients automatically

```typescript
// In booking.service.ts:
eventBus.emit(DomainEvent.BOOKING_CONFIRMED, { bookingId, userId, paymentId });

// In socket.gateway.ts (listener registered at startup):
eventBus.on(DomainEvent.BOOKING_CONFIRMED, ({ bookingId, userId }) => {
  io.to(`user:${userId}`).emit('booking:update', { bookingId, status: 'confirmed' });
});
```
