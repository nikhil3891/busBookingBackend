# API Contracts

**Base URL:** `/api`  
**Auth:** `Authorization: Bearer <accessToken>`  
**Tenant:** `X-Tenant-Id: <tenantSlug>` (optional; also derived from subdomain)

## Standard Response Envelope

```typescript
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "code": "ERROR_CODE", "message": "Human-readable message" }

// Validation Error
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [{ "field": "phone", "message": "..." }]
}
```

---

## Auth Module `/api/auth`

### POST `/api/auth/send-otp`
Rate limited: 10 req / 15 min per IP+phone.

**Request:**
```json
{ "phone": "9876543210" }
```
**Response 200:**
```json
{ "success": true, "data": { "message": "OTP sent successfully" } }
```

---

### POST `/api/auth/verify-otp`

**Request:**
```json
{
  "phone": "9876543210",
  "otp": "123456",
  "deviceId": "uuid-optional",
  "deviceName": "iPhone 15 (optional)"
}
```
**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "phone": "9876543210",
      "role": "user",
      "fullName": null,
      "isVerified": true,
      "profileCompleted": false
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    },
    "profileRequired": true
  }
}
```

---

### POST `/api/auth/complete-registration`

**Request:**
```json
{
  "phone": "9876543210",
  "fullName": "John Doe",
  "email": "john@example.com",
  "gender": "male",
  "dob": "1995-06-15"
}
```
**Response 200:**
```json
{ "success": true, "data": { "message": "Profile completed successfully" } }
```

---

### POST `/api/auth/refresh-token`

**Request:**
```json
{ "userId": "...", "refreshToken": "eyJ...", "deviceId": "uuid" }
```
**Response 200:**
```json
{
  "success": true,
  "data": { "accessToken": "eyJ...", "refreshToken": "eyJ..." }
}
```

---

### POST `/api/auth/logout` 🔒
**Request:** `{ "refreshToken": "eyJ..." }`  
**Response 200:** `{ "success": true, "data": { "message": "Logged out successfully" } }`

### POST `/api/auth/logout-all` 🔒
Revokes all sessions on all devices.

### POST `/api/auth/admin/login`
Admin/Operator password login.
**Request:** `{ "phone": "9876543210", "password": "..." }` or `{ "email": "...", "password": "..." }`

### POST `/api/auth/admin/create` 🔒 (admin/super_admin only)
**Request:**
```json
{
  "phone": "9876543210",
  "fullName": "Operator Name",
  "role": "operator",
  "password": "securepassword",
  "tenantId": "optional"
}
```

---

## User Module `/api/users`

### GET `/api/users/me` 🔒
Returns the authenticated user's profile.

### PUT `/api/users/me` 🔒
Update profile. Fields all optional:
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "gender": "female",
  "dob": "1998-01-20",
  "address": "123 Main St"
}
```

### GET `/api/users` 🔒 (admin/super_admin)
Paginated user list.
**Query:** `?page=1&limit=20`

### PATCH `/api/users/:userId/deactivate` 🔒 (admin/super_admin)
### PATCH `/api/users/:userId/activate` 🔒 (admin/super_admin)

---

## Bus Module `/api/buses`

### GET `/api/buses`
Search buses.
**Query params:**
```
from=Bangalore&to=Mysore&date=2026-06-01&vehicleType=ac_seater&page=1&limit=20
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "data": [ { "busNo": "KA01B1234", "route": {...}, "seats": [...], ... } ],
    "pagination": { "total": 5, "page": 1, "limit": 20, "totalPages": 1, "hasNext": false, "hasPrev": false }
  }
}
```

### GET `/api/buses/:id`
Get bus details with operator info.

### GET `/api/buses/:id/seats`
Get available seats for a bus.

### POST `/api/buses` 🔒 (operator/admin/super_admin)
```json
{
  "busNo": "KA01B1234",
  "vehicleType": "ac_seater",
  "route": { "from": "Bangalore", "to": "Mysore", "stops": [] },
  "departAt": "2026-06-01T08:00:00.000Z",
  "arriveAt": "2026-06-01T11:00:00.000Z",
  "totalSeats": 40,
  "baseFare": 350,
  "amenities": ["ac", "wifi", "charging_port"]
}
```

### PUT `/api/buses/:id` 🔒 (operator/admin/super_admin)
Partial update of bus. Same shape as POST, all fields optional.

### DELETE `/api/buses/:id` 🔒 (admin/super_admin)

---

## Booking Module `/api/bookings`

### POST `/api/bookings` 🔒
Create a booking (seats temporarily locked in Redis).

**Request:**
```json
{
  "busId": "...",
  "travelDate": "2026-06-01T00:00:00.000Z",
  "from": "Bangalore",
  "to": "Mysore",
  "passengers": [
    { "name": "Alice", "age": 28, "gender": "female", "seatNo": "05" },
    { "name": "Bob", "age": 30, "gender": "male", "seatNo": "06" }
  ]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "bookingRef": "BBMXK1A2B3C",
      "pnrNumber": "XK3PLM2A",
      "status": "pending",
      "totalFare": 700,
      ...
    }
  }
}
```

### GET `/api/bookings/my` 🔒
List own bookings.
**Query:** `?page=1&limit=20&status=confirmed&upcoming=true`

### GET `/api/bookings/:id` 🔒
Get booking details. Users can only see their own; admin/operator see all.

### PATCH `/api/bookings/:id/cancel` 🔒
Cancel booking.
**Request:** `{ "reason": "optional reason" }`

### GET `/api/bookings` 🔒 (admin/operator only)
List all bookings with user/bus populated.

---

## Payment Module `/api/payments`

### POST `/api/payments/initiate` 🔒
Initiate payment for a pending booking.

**Request:**
```json
{
  "bookingId": "...",
  "method": "upi",
  "provider": "razorpay",
  "upiId": "user@paytm",
  "metadata": { "razorpay_order_id": "..." }
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "payment": {
      "status": "initiated",
      "amount": 700,
      "method": "upi",
      ...
    }
  }
}
```

### POST `/api/payments/verify` 🔒
Verify payment from provider callback.

**Request:**
```json
{
  "paymentId": "...",
  "providerReference": "pay_xxxxxx",
  "signature": "optional_hmac_signature"
}
```

On success: booking is confirmed, seats marked booked, invoice PDF queued.

### GET `/api/payments/:id` 🔒
Get payment details.

### POST `/api/payments/:id/refund` 🔒 (admin/super_admin)
```json
{ "amount": 350, "reason": "Partial refund for cancellation" }
```

---

## Notification Module `/api/notifications`

### GET `/api/notifications` 🔒
Get notifications relevant to the current user (target: all, users, custom).
**Query:** `?page=1&limit=20`

### PATCH `/api/notifications/:id/read` 🔒
Mark notification as read.

### POST `/api/notifications` 🔒 (admin/operator/super_admin)
```json
{
  "title": "Service Update",
  "body": "Bus KA01B1234 is delayed by 30 minutes.",
  "type": "warning",
  "target": "custom",
  "targetIds": ["userId1", "userId2"],
  "channels": ["in_app", "sms"],
  "expiresAt": "2026-06-02T00:00:00.000Z"
}
```

### DELETE `/api/notifications/:id` 🔒 (admin/super_admin)

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Zod schema failure |
| `INVALID_OTP` | 400 | Wrong or expired OTP |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient role/permission |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate (seat taken, email in use) |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `DUPLICATE_KEY` | 409 | MongoDB unique constraint |
| `INVALID_ID` | 400 | Invalid ObjectId |
