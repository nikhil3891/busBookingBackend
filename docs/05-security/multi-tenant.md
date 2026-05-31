# Multi-Tenant Design

## Strategy: Shared Database, Shared Collections

All tenants share the same MongoDB instance and collections. Data isolation is enforced at the **application layer** using a `tenantId` field.

**Trade-offs:**
| Aspect | Shared Collections | Separate DBs |
|--------|-------------------|--------------|
| Simplicity | ✅ Simple | ❌ Complex |
| Cost | ✅ Low | ❌ Higher |
| Isolation | ⚠️ App-enforced | ✅ Hard boundary |
| Migration | ✅ Single schema | ❌ Per-tenant |
| Query Performance | ⚠️ Index on tenantId needed | ✅ Isolated |

For most SaaS bus booking apps at early/mid scale, shared collections is the right call.

---

## Tenant Identification

The `tenantMiddleware` extracts `tenantId` from requests in priority order:

1. **Authenticated user's JWT** (`tenantId` claim) — most reliable after login
2. **`X-Tenant-Id` header** — for API clients / mobile apps
3. **Subdomain** — `tenant1.busbooking.com` → `tenantId = "tenant1"`
4. **Query param** `?tenantId=` — dev only, disabled in production

```typescript
// In routes/index.ts
router.use(tenantMiddleware); // runs before all routes
```

---

## Tenant Model

```typescript
{
  name: "ABC Travels",
  slug: "abc-travels",        // used in subdomain routing
  status: "active",
  plan: "pro",
  ownerId: ObjectId,          // links to User (admin role)
  settings: {
    maxBuses: 50,
    maxOperators: 10,
    features: {
      smsEnabled: true,
      pdfInvoiceEnabled: true,
      analyticsEnabled: true
    }
  },
  contact: { email: "abc@travels.com" },
  branding: {
    appName: "ABC Travels",
    primaryColor: "#FF5722"
  }
}
```

---

## Data Query Pattern

Every service method that queries tenant-scoped data accepts `tenantId?`:

```typescript
async search(dto: SearchBusDto, tenantId?: string) {
  const filter = {
    ...,
    ...(tenantId ? { tenantId } : {}),
  };
  return Bus.find(filter);
}
```

**Super admin** calls without `tenantId` to query globally.  
**Tenant admin** always has `tenantId` from their JWT, so they only see their data.

---

## Tenant Creation Flow

1. `POST /api/tenants` (super_admin only) — creates Tenant + assigns ownerId
2. Owner logs in as admin; creates operators with `tenantId` set
3. Operators create buses with their `tenantId`
4. Users onboard via OTP (tenantId set if app routes to tenant subdomain)

---

## Future: Stronger Isolation

When a tenant requests stronger isolation (compliance, data residency):

1. **Collection prefix**: `abc_buses`, `abc_bookings` — still same DB
2. **Separate database**: `busBooking_abc` — completely isolated
3. **Separate cluster**: Rare, only for enterprise with strict SLA

This codebase is designed to migrate to option 2/3 by changing the Mongoose connection factory, without restructuring service code.

---

## Tenant Suspension

When `tenant.status = 'suspended'`, all API requests for that tenant should return `403 Tenant Suspended`.

To implement: add a `checkTenantStatus` middleware after `tenantMiddleware`:

```typescript
export async function checkTenantStatus(req, res, next) {
  if (!req.tenantId) return next();
  const tenant = await Tenant.findOne({ slug: req.tenantId });
  if (tenant?.status === 'suspended') {
    return next(new ForbiddenError('Tenant account is suspended'));
  }
  next();
}
```
