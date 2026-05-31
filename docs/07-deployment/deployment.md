# Deployment Guide

## Environment Variables

Copy `.env.example` to `.env` and fill in every value before starting.

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | ✅ | `development` / `production` |
| `PORT` | ✅ | HTTP port (default `4001`) |
| `MONGO_URI` | ✅ | Full MongoDB connection string |
| `REDIS_HOST` | ✅ | Redis hostname |
| `REDIS_PORT` | ✅ | Redis port (default `6379`) |
| `REDIS_PASSWORD` | — | Redis auth password (production) |
| `JWT_SECRET` | ✅ | At least 64 random characters |
| `JWT_EXPIRES_IN` | ✅ | Access token TTL (e.g. `15m`) |
| `REFRESH_EXPIRES_IN` | ✅ | Refresh token TTL (e.g. `7d`) |
| `SMTP_HOST/USER/PASS` | — | Email sending (leave blank to log in dev) |
| `SMS_API_KEY` | — | SMS provider API key |
| `BULL_BOARD_USER/PASS` | ✅ | Queue dashboard credentials |
| `CORS_ORIGINS` | ✅ | Comma-separated allowed origins |

---

## Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Start MongoDB + Redis
docker-compose up mongo redis -d

# 3. Copy and edit env
cp .env.example .env

# 4. Start dev server (hot reload)
pnpm dev
```

**Endpoints:**
- API: `http://localhost:4001/api`
- Health: `http://localhost:4001/api/health`
- Queue dashboard: `http://localhost:4001/admin/queues`
- MongoDB UI: `http://localhost:8081` (run with `--profile tools`)

---

## Docker (Full Stack)

```bash
# Build and start everything
docker-compose up --build

# With MongoDB admin UI
docker-compose --profile tools up --build
```

---

## Production Deployment

### Build

```bash
pnpm build         # Compiles TypeScript → dist/
pnpm start         # Runs dist/server.js
```

### Docker Production

```bash
docker build -t bus-booking-api:latest .
docker run -p 4001:4001 --env-file .env bus-booking-api:latest
```

### Checklist Before Go-Live

- [ ] `JWT_SECRET` is at least 64 random characters
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGINS` is set to your actual domain(s)
- [ ] `BULL_BOARD_PASS` is changed from the default
- [ ] Redis has a password set (`REDIS_PASSWORD`)
- [ ] MongoDB Atlas IP whitelist is configured
- [ ] SMTP credentials are set for email delivery
- [ ] `logs/` directory is writable (Winston file logs)
- [ ] `uploads/invoices/` is writable (or use S3)
- [ ] Run `pnpm test` — all tests pass
- [ ] Health check `GET /api/health` returns `{ "status": "ok" }`

---

## Scaling Notes

- **App is stateless** (sessions in Redis, not memory) — safe to run multiple instances behind a load balancer
- **BullMQ workers** should run in a dedicated process in production (not in the same process as the API) — separate `worker.ts` entrypoint
- **MongoDB**: Use Atlas with connection pooling (`maxPoolSize: 10` already configured)
- **Redis**: Use Redis Sentinel or Redis Cluster for HA in production
- **Logs**: In production, ship logs from `logs/combined.log` to ELK, Datadog, or CloudWatch
