# Bus Booking Backend — Documentation

> Enterprise-grade Modular Monolith | Node.js + TypeScript + MongoDB + Redis + BullMQ + Socket.IO

---

## Folder Structure

```
docs/
├── README.md                          ← You are here (index)
│
├── 01-overview/                       ← Start here
│   ├── architecture.md                  System design, module map, tech choices
│   └── roadmap.md                       What to add next (web, mobile, SaaS scale)
│
├── 02-api/                            ← For frontend / mobile developers
│   ├── api-contracts.md                 All endpoints, request/response shapes, error codes
│   └── postman-testing-guide.md         Step-by-step Postman testing for every module
│
├── 03-database/                       ← For backend / DBA
│   └── database-schema.md               MongoDB collections, ER diagram, indexes, data retention
│
├── 04-infrastructure/                 ← For DevOps / backend
│   ├── redis-design.md                  OTP, sessions, seat locking, caching strategy
│   ├── queue-design.md                  BullMQ jobs — email, SMS, invoice PDF, analytics
│   └── socket-events.md                 Socket.IO real-time events and client usage
│
├── 05-security/                       ← For auth / compliance
│   ├── rbac.md                          Roles, permissions, middleware usage
│   └── multi-tenant.md                  Multi-tenancy strategy and tenant isolation
│
├── 06-testing/                        ← For QA / developers
│   └── testing-guide.md                 Unit + E2E test setup, patterns, coverage goals
│
└── 07-deployment/                     ← For DevOps / release
    └── deployment.md                    Docker, env vars, production checklist
```

---

## Quick Navigation

| I want to… | Go to |
|------------|-------|
| Understand the system design | [01-overview/architecture.md](./01-overview/architecture.md) |
| See the API endpoints | [02-api/api-contracts.md](./02-api/api-contracts.md) |
| Test APIs in Postman | [02-api/postman-testing-guide.md](./02-api/postman-testing-guide.md) |
| Understand the database models | [03-database/database-schema.md](./03-database/database-schema.md) |
| See how Redis is used | [04-infrastructure/redis-design.md](./04-infrastructure/redis-design.md) |
| Understand background jobs | [04-infrastructure/queue-design.md](./04-infrastructure/queue-design.md) |
| Integrate Socket.IO on the client | [04-infrastructure/socket-events.md](./04-infrastructure/socket-events.md) |
| Understand auth roles and permissions | [05-security/rbac.md](./05-security/rbac.md) |
| Understand multi-tenant SaaS design | [05-security/multi-tenant.md](./05-security/multi-tenant.md) |
| Write or run tests | [06-testing/testing-guide.md](./06-testing/testing-guide.md) |
| Deploy to production | [07-deployment/deployment.md](./07-deployment/deployment.md) |
| Plan what to build next | [01-overview/roadmap.md](./01-overview/roadmap.md) |

---

## Quick Start

```bash
pnpm install                  # install dependencies
cp .env.example .env          # set up environment
docker-compose up mongo redis -d  # start MongoDB + Redis
pnpm dev                      # start dev server on :4001
pnpm test                     # run all tests
```

**Key URLs (dev):**
| URL | What |
|-----|------|
| `http://localhost:4001/api/health` | Health check |
| `http://localhost:4001/api/auth/send-otp` | Auth entry point |
| `http://localhost:4001/admin/queues` | BullMQ job dashboard |
| `http://localhost:8081` | MongoDB UI (run `--profile tools`) |

---

## What's Built

| Module | Location | Purpose |
|--------|----------|---------|
| Auth | `src/modules/auth/` | OTP login, JWT, device sessions, admin auth |
| User | `src/modules/user/` | Profile management, admin user CRUD |
| Bus | `src/modules/bus/` | Bus CRUD, search, Redis cache |
| Booking | `src/modules/booking/` | Seat locking, transactions, cancel flow |
| Payment | `src/modules/payment/` | Initiate, verify, refund |
| Notification | `src/modules/notification/` | Multi-channel, TTL, read tracking |
| Tenant | `src/modules/tenant/` | SaaS multi-tenancy |
| Jobs | `src/jobs/` | BullMQ email/SMS/invoice/analytics workers |
| Socket | `src/socket/` | Real-time updates via Socket.IO |
