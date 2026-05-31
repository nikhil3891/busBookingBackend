# Queue Design — BullMQ

## Infrastructure

- **Queue backend:** Redis (shared with cache/lock/OTP)
- **Library:** BullMQ v5
- **Dashboard:** Bull Board at `/admin/queues`
- **Workers:** Started in `server.ts` bootstrap

---

## Queues

### 1. Email Queue (`email`)

| Job Name | Trigger | Handler |
|----------|---------|---------|
| `booking-created` | Booking created | Send booking receipt email |
| `booking-confirmed` | Payment verified | Send confirmed ticket email |
| `booking-cancelled` | Booking cancelled | Send cancellation email |
| `payment-success` | Payment verified | Send payment receipt |
| `payment-failed` | Payment failed | Send failure email |
| `welcome` | User registered | Welcome email |

**Config:** 3 retries, exponential backoff starting 5s, keep 100 completed, 200 failed.

---

### 2. SMS Queue (`sms`)

| Job Name | Trigger | Handler |
|----------|---------|---------|
| `otp` | OTP requested | Send OTP via SMS |
| `booking-confirmed` | Booking confirmed | Send PNR via SMS |
| `booking-cancelled` | Booking cancelled | SMS notification |

**Config:** 3 retries, 3s backoff. SMS provider: pluggable (MSG91, Twilio, etc.)

---

### 3. Invoice Queue (`invoice`)

| Job Name | Trigger | Handler |
|----------|---------|---------|
| `generate-invoice` | Payment success | Generate PDF ticket + update ticketUrl |

**Config:** 3 retries, 5s backoff, concurrency 2 (CPU-intensive PDF work).

PDF saved to: `/uploads/invoices/invoice-{bookingRef}.pdf`
In production: upload to S3, store URL in booking.

---

### 4. Analytics Queue (`analytics`)

| Job Name | Trigger | Handler |
|----------|---------|---------|
| `daily-analytics` | Midnight cron | Aggregate daily bookings/revenue per tenant, cache in Redis |
| `reconciliation` | Manual or scheduled | Cross-check payments vs bookings |

**Config:** 2 retries, 10s backoff, concurrency 1 (avoid conflicting aggregations).

---

## Adding a New Job

1. Define job data interface in `src/jobs/queues/<name>.queue.ts`
2. Create queue and export it
3. Create worker in `src/jobs/workers/<name>.worker.ts`
4. Register worker in `src/server.ts` bootstrap
5. Add queue to Bull Board in `src/app.ts`
6. Emit from the module that triggers it (service or event listener)

---

## Future Jobs to Add

| Job | Queue | Notes |
|-----|-------|-------|
| WhatsApp messages | `whatsapp` | Use WhatsApp Business API |
| Bulk email campaigns | `email` | Batch with chunking |
| Report PDF generation | `reports` | Monthly/weekly business reports |
| Inventory reconciliation | `analytics` | Daily bus seat counts vs bookings |
| Push notifications | `push` | FCM for mobile |
| Refund processing | `payment` | Async refund with payment gateway |

---

## Monitoring

- **Bull Board**: `http://localhost:4001/admin/queues`
  - See active, waiting, delayed, completed, failed jobs
  - Retry failed jobs manually
  - Credentials configured via `BULL_BOARD_USER` / `BULL_BOARD_PASS` env vars

- In production: add Prometheus metrics via `@bull-board/api` or `bullmq-otel`
