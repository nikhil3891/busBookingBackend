# Database Schema — MongoDB

## Collections Overview

| Collection | Purpose | Multi-Tenant |
|------------|---------|--------------|
| `users` | All user types (user/operator/admin/super_admin) | ✅ `tenantId` field |
| `tenants` | SaaS tenant records | N/A |
| `buses` | Bus routes, seats, schedule | ✅ `tenantId` field |
| `bookings` | Passenger bookings | ✅ `tenantId` field |
| `payments` | Payment records | ✅ `tenantId` field |
| `notifications` | In-app notifications | ✅ `tenantId` field |

---

## ER Diagram (ASCII)

```
┌─────────────┐      ┌──────────────────┐
│   Tenant    │      │      User        │
├─────────────┤      ├──────────────────┤
│ _id         │◄─────┤ tenantId (ref)   │
│ name        │      │ phone (unique)   │
│ slug        │      │ email            │
│ plan        │      │ fullName         │
│ ownerId ────┼──────► role (enum)      │
│ settings    │      │ password (hash)  │
│ status      │      │ refreshTokens[]  │
│ contact     │      │ isVerified       │
│ branding    │      │ profileCompleted │
└─────────────┘      └──────────┬───────┘
                                │
                    ┌───────────▼──────────┐
                    │         Bus          │
                    ├──────────────────────┤
                    │ _id                  │
                    │ busNo               │
                    │ operatorId (ref User)│
                    │ tenantId (ref Tenant)│
                    │ vehicleType          │
                    │ route.from/to        │
                    │ route.stops[]        │
                    │ departAt / arriveAt  │
                    │ seats[]              │
                    │   - seatNo          │
                    │   - status (enum)    │
                    │   - fare             │
                    │ baseFare             │
                    │ amenities[]          │
                    │ status (enum)        │
                    └──────────┬───────────┘
                               │
              ┌────────────────▼─────────────────────┐
              │              Booking                 │
              ├──────────────────────────────────────┤
              │ _id                                  │
              │ bookingRef (unique, auto-gen)        │
              │ pnrNumber (unique, auto-gen)         │
              │ userId (ref User)                    │
              │ busId (ref Bus)                      │
              │ tenantId (ref Tenant)                │
              │ travelDate / from / to               │
              │ passengers[]                         │
              │   - name, age, gender, seatNo        │
              │ totalFare                            │
              │ paymentId (ref Payment)              │
              │ status (pending|confirmed|cancelled) │
              │ cancellationReason / cancelledAt     │
              └──────────────────┬───────────────────┘
                                 │
              ┌──────────────────▼───────────────────┐
              │             Payment                  │
              ├──────────────────────────────────────┤
              │ _id                                  │
              │ userId (ref User)                    │
              │ bookingId (ref Booking, unique)      │
              │ tenantId (ref Tenant)                │
              │ amount / currency                    │
              │ method (upi|card|netbanking|wallet)  │
              │ provider (razorpay|stripe|manual)    │
              │ providerReference                    │
              │ status (initiated|success|failed)    │
              │ refunds[]                            │
              │   - amount, reason, refundedAt       │
              │ totalRefunded                        │
              │ paidAt                               │
              └──────────────────────────────────────┘

              ┌──────────────────────────────────────┐
              │           Notification               │
              ├──────────────────────────────────────┤
              │ _id                                  │
              │ tenantId (ref Tenant)                │
              │ title / body / type                  │
              │ target (all|users|operators|custom)  │
              │ targetIds[] (ref User)               │
              │ channels[] (in_app|email|sms|push)   │
              │ createdBy (ref User)                 │
              │ expiresAt (TTL index)                │
              │ readBy[] / deliveredTo[]             │
              └──────────────────────────────────────┘
```

---

## Index Strategy

### `users`
```
{ phone: 1 }              unique
{ email: 1 }              sparse
{ tenantId: 1 }
{ role: 1 }
```

### `buses`
```
{ route.from: 1, route.to: 1, departAt: 1 }    compound search index
{ operatorId: 1 }
{ tenantId: 1 }
{ status: 1 }
```

### `bookings`
```
{ userId: 1 }
{ busId: 1 }
{ tenantId: 1 }
{ pnrNumber: 1 }          unique
{ bookingRef: 1 }         unique
{ travelDate: 1, status: 1 }
```

### `payments`
```
{ userId: 1 }
{ bookingId: 1 }          unique
{ tenantId: 1 }
{ status: 1 }
{ providerReference: 1 }  sparse
```

---

## Tenant Isolation Strategy

Every multi-tenant collection has `tenantId?: ObjectId` field.

Queries are filtered by `tenantId` when present:
- User-facing routes: tenant is derived from JWT or X-Tenant-Id header
- Super admin can query across tenants (no tenantId filter)
- Data is never mixed between tenants at the application layer

> **Note:** This is a **shared database, shared collection** approach (simplest). For stronger isolation, consider **shared database, separate collection prefix** or **separate database per tenant** at scale.

---

## Data Retention Notes

- Refresh tokens: Cleaned up nightly (7-day TTL via cron)
- Notifications: TTL index (`expiresAt`) deletes expired notifications automatically
- Invoices: Stored on disk (`/uploads/invoices/`); implement S3 upload for production
- Logs: Winston file logs in `/logs/`; ship to ELK or Datadog in production
