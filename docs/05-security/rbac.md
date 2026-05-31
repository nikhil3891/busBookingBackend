# Role-Based Access Control (RBAC)

## Roles

| Role | Description |
|------|-------------|
| `user` | Registered passenger — can book, view own bookings, manage profile |
| `operator` | Bus operator — can create/manage buses, view their bookings |
| `admin` | Tenant administrator — manages operators, users, analytics |
| `super_admin` | Platform owner — has all permissions across all tenants |

---

## Permissions Map

```typescript
enum Permission {
  // Profile
  READ_PROFILE, UPDATE_PROFILE,

  // Booking
  CREATE_BOOKING, READ_OWN_BOOKING, READ_ALL_BOOKINGS,
  CANCEL_OWN_BOOKING, CANCEL_ANY_BOOKING,

  // Bus
  READ_BUS, CREATE_BUS, UPDATE_BUS, DELETE_BUS,

  // Payment
  INITIATE_PAYMENT, READ_OWN_PAYMENT, READ_ALL_PAYMENTS, REFUND_PAYMENT,

  // Notification
  READ_NOTIFICATIONS, CREATE_NOTIFICATION, DELETE_NOTIFICATION,

  // Admin
  MANAGE_USERS, MANAGE_TENANTS, VIEW_ANALYTICS, MANAGE_OPERATORS
}
```

### Permission Assignment

| Permission | user | operator | admin | super_admin |
|-----------|------|----------|-------|-------------|
| READ_PROFILE | ✅ | ✅ | ✅ | ✅ |
| UPDATE_PROFILE | ✅ | ✅ | ✅ | ✅ |
| CREATE_BOOKING | ✅ | ❌ | ❌ | ✅ |
| READ_OWN_BOOKING | ✅ | ❌ | ❌ | ✅ |
| READ_ALL_BOOKINGS | ❌ | ✅ | ✅ | ✅ |
| CANCEL_OWN_BOOKING | ✅ | ❌ | ❌ | ✅ |
| CANCEL_ANY_BOOKING | ❌ | ❌ | ✅ | ✅ |
| READ_BUS | ✅ | ✅ | ✅ | ✅ |
| CREATE_BUS | ❌ | ✅ | ✅ | ✅ |
| UPDATE_BUS | ❌ | ✅ | ✅ | ✅ |
| DELETE_BUS | ❌ | ❌ | ✅ | ✅ |
| INITIATE_PAYMENT | ✅ | ❌ | ❌ | ✅ |
| REFUND_PAYMENT | ❌ | ❌ | ✅ | ✅ |
| READ_ALL_PAYMENTS | ❌ | ✅ | ✅ | ✅ |
| CREATE_NOTIFICATION | ❌ | ✅ | ✅ | ✅ |
| DELETE_NOTIFICATION | ❌ | ❌ | ✅ | ✅ |
| MANAGE_USERS | ❌ | ❌ | ✅ | ✅ |
| MANAGE_TENANTS | ❌ | ❌ | ❌ | ✅ |
| VIEW_ANALYTICS | ❌ | ✅ | ✅ | ✅ |

---

## Middleware Usage

```typescript
import { authenticate, authorize, requireRoles } from '../core/middlewares/auth.middleware';
import { Permission, Role } from '../core/types';

// Option 1: Permission-based (most granular)
router.delete('/bus/:id',
  authenticate,
  authorize(Permission.DELETE_BUS),
  busController.remove
);

// Option 2: Role-based (simpler for role-gating)
router.get('/admin/users',
  authenticate,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  userController.listUsers
);

// Option 3: JWT only (any authenticated user)
router.get('/me',
  authenticate,
  userController.getProfile
);

// Option 4: Optional auth (public route, enriches req.user if token present)
router.get('/buses',
  optionalAuth,
  busController.search
);
```

---

## Admin Creation Flow

Admins and operators are created by existing `admin` or `super_admin` accounts:

```
POST /api/auth/admin/create
Authorization: Bearer <admin_access_token>

{
  "phone": "9876543210",
  "fullName": "New Operator",
  "role": "operator",
  "password": "SecurePass123!",
  "tenantId": "tenant_objectId"
}
```

This creates a `User` document with `role: operator` and `password` set. The operator then logs in via `POST /api/auth/admin/login`.

---

## Security Notes

1. **OTP flow** does not check roles — it creates or retrieves `user`-role accounts only
2. **Admin login** uses password (bcrypt) + explicit role check; rejects `user` role
3. **Refresh tokens** are stored as SHA-256 hashes in MongoDB — even if leaked, raw token is useless without salt
4. **Access tokens** expire in 15 minutes; refresh tokens in 7 days
5. **Device sessions**: each device gets its own refresh token; logout one device or all
