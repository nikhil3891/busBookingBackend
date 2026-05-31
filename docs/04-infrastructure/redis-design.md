# Redis Design

Redis is used **exclusively as a cache and ephemeral store**. Business data (bookings, users, payments) lives only in MongoDB.

---

## Key Namespaces

| Namespace | TTL | Purpose |
|-----------|-----|---------|
| `otp:<phone>` | 5 min | One-time password for phone verification |
| `sess:<userId>:<deviceId>` | 24 h | Session metadata (optional, for enhanced device management) |
| `seat_lock:<busId>:<seats>` | 10 min | Prevents double-booking during payment flow |
| `rate:<key>` | Window | Rate limiting counters |
| `cache:<key>` | 5 min (default) | Bus search results, bus detail cache |
| `analytics:<tenantId>:<metric>` | 24 h | Real-time counters for dashboard |

---

## OTP Store

**Why Redis, not MongoDB?**
- Automatic TTL expiry (no cron needed for OTP cleanup)
- Sub-millisecond reads (critical for UX during auth)
- OTP is ephemeral — doesn't need persistence guarantees

```
SET otp:9876543210 "182736"
EXPIRE otp:9876543210 300
```

After OTP verified → immediate `DEL otp:9876543210`

---

## Seat Locking (Distributed Lock)

This solves the **double-booking race condition** without MongoDB transactions alone.

**Flow:**
1. User selects seats on frontend
2. `POST /api/bookings` → `lockSeats(busId, ['05','06'], userId)` in Redis
3. If lock acquired → create Booking (status=pending), update bus seats to 'locked'
4. User initiates payment
5. On payment success → `confirmBooking()` → marks seats 'booked', unlocks Redis lock
6. On payment failure / timeout → seats auto-unlock after `SEAT_LOCK_TTL_SECONDS` (10 min)

```
SET seat_lock:BUS_ID:05,06 USER_ID EX 600 NX
```

**Concurrent scenario:**
- User A locks seat 05 → gets lock
- User B tries to lock seat 05 → fails → gets `ConflictError: "Seats being booked by another user"`

---

## Bus Cache

Search results and individual bus detail are cached to reduce DB load.

```
SETEX cache:bus:search:{hash_of_query} 300 {JSON}
SETEX cache:bus:{busId} 300 {JSON}
```

Cache is **invalidated on any write**:
- Bus created → `DEL cache:bus:search:*` (pattern delete)
- Bus updated → `DEL cache:bus:{busId}` + pattern delete
- Bus deleted → same

---

## Rate Limiting

Three rate limiters protect different endpoints:

| Limiter | Limit | Applied To |
|---------|-------|-----------|
| `globalRateLimiter` | 100 req / 15 min | All `/api/*` routes |
| `authRateLimiter` | 10 req / 15 min | `POST /auth/send-otp`, `POST /auth/verify-otp` |
| `strictRateLimiter` | 5 req / 1 min | `POST /auth/admin/login` |

Rate limit counters are stored in Redis:
```
INCR rate:127.0.0.1
EXPIRE rate:127.0.0.1 900
```

---

## Analytics Cache

Real-time event counters accumulate in Redis during the day, then a daily cron job reads them and stores the report in MongoDB (or another permanent store).

```
INCR analytics:tenant_abc:bookings_today
INCR analytics:tenant_abc:revenue_today
```

These are read by the admin dashboard for live stats without hitting MongoDB on every request.

---

## What NOT to Store in Redis

| ❌ Don't Store | ✅ Store In |
|---------------|-----------|
| Booking details | MongoDB |
| User profile | MongoDB |
| Payment records | MongoDB |
| Business reports | MongoDB |
| Refresh tokens (SHA-256 hash) | MongoDB (on User document) |
| Invoice PDFs | Disk / S3 |
