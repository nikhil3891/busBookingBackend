# Postman Testing Guide

Complete step-by-step guide to test every API module in Postman.

---

## 1. Environment Setup

Before testing anything, create a **Postman Environment** so variables are shared across all requests.

### Create Environment: `Bus Booking - Local`

Go to **Environments → +** and add these variables:

| Variable | Initial Value | Description |
|----------|--------------|-------------|
| `BASE_URL` | `http://localhost:4001/api` | API base URL |
| `ACCESS_TOKEN` | *(empty)* | Auto-filled after login |
| `REFRESH_TOKEN` | *(empty)* | Auto-filled after login |
| `USER_ID` | *(empty)* | Auto-filled after login |
| `PHONE` | `9876543210` | Your test phone number |
| `BUS_ID` | *(empty)* | Auto-filled after creating a bus |
| `BOOKING_ID` | *(empty)* | Auto-filled after creating a booking |
| `PAYMENT_ID` | *(empty)* | Auto-filled after initiating payment |
| `NOTIFICATION_ID` | *(empty)* | Auto-filled after creating notification |
| `ADMIN_TOKEN` | *(empty)* | Auto-filled after admin login |

> **Activate** this environment (top-right dropdown in Postman) before running any request.

---

## 2. Health Check

**Verify the server is running before anything else.**

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{BASE_URL}}/health` |
| Auth | None |

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-31T...",
  "environment": "development"
}
```

---

## Module 1 — Auth

> **Order matters:** Send OTP → Verify OTP → Complete Registration → (use token for everything else)

### Step 1.1 — Send OTP

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/auth/send-otp` |
| Body (JSON) | `{ "phone": "{{PHONE}}" }` |

**Expected:**
```json
{ "success": true, "data": { "message": "OTP sent successfully" } }
```

> In dev mode the OTP is printed in the **server terminal log** — check there.

---

### Step 1.2 — Verify OTP

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/auth/verify-otp` |
| Body (JSON) | See below |

```json
{
  "phone": "{{PHONE}}",
  "otp": "123456",
  "deviceId": "postman-device-01",
  "deviceName": "Postman"
}
```

**Auto-save tokens** — add this to the **Tests** tab of this request:

```javascript
const res = pm.response.json();
if (res.success) {
  pm.environment.set("ACCESS_TOKEN", res.data.tokens.accessToken);
  pm.environment.set("REFRESH_TOKEN", res.data.tokens.refreshToken);
  pm.environment.set("USER_ID", res.data.user.id);
}
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "phone": "9876543210", "role": "user", "profileCompleted": false },
    "tokens": { "accessToken": "eyJ...", "refreshToken": "eyJ..." },
    "profileRequired": true
  }
}
```

---

### Step 1.3 — Complete Registration

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/auth/complete-registration` |
| Body (JSON) | See below |

```json
{
  "phone": "{{PHONE}}",
  "fullName": "John Doe",
  "email": "john@example.com",
  "gender": "male",
  "dob": "1995-06-15"
}
```

**Expected:**
```json
{ "success": true, "data": { "message": "Profile completed successfully" } }
```

---

### Step 1.4 — Refresh Token

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/auth/refresh-token` |
| Body (JSON) | See below |

```json
{
  "userId": "{{USER_ID}}",
  "refreshToken": "{{REFRESH_TOKEN}}",
  "deviceId": "postman-device-01"
}
```

**Auto-update tokens** — add to **Tests** tab:
```javascript
const res = pm.response.json();
if (res.success) {
  pm.environment.set("ACCESS_TOKEN", res.data.accessToken);
  pm.environment.set("REFRESH_TOKEN", res.data.refreshToken);
}
```

---

### Step 1.5 — Logout

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/auth/logout` |
| Auth | Bearer `{{ACCESS_TOKEN}}` |
| Body (JSON) | `{ "refreshToken": "{{REFRESH_TOKEN}}" }` |

---

### Step 1.6 — Admin Login

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/auth/admin/login` |
| Body (JSON) | See below |

```json
{
  "phone": "9999999999",
  "password": "AdminPass123!"
}
```

**Auto-save admin token** — add to **Tests** tab:
```javascript
const res = pm.response.json();
if (res.success) {
  pm.environment.set("ADMIN_TOKEN", res.data.tokens.accessToken);
  pm.environment.set("USER_ID", res.data.user.id);
}
```

---

### Step 1.7 — Create Admin / Operator *(requires admin token)*

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/auth/admin/create` |
| Auth | Bearer `{{ADMIN_TOKEN}}` |
| Body (JSON) | See below |

```json
{
  "phone": "9876500001",
  "fullName": "Bus Operator One",
  "role": "operator",
  "password": "Operator@123"
}
```

---

## Module 2 — User

> All routes require `Authorization: Bearer {{ACCESS_TOKEN}}`

**Set Auth for all User requests:** In the **Authorization** tab → Type: `Bearer Token` → Token: `{{ACCESS_TOKEN}}`

### Step 2.1 — Get My Profile

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{BASE_URL}}/users/me` |
| Auth | Bearer `{{ACCESS_TOKEN}}` |

---

### Step 2.2 — Update My Profile

| Field | Value |
|-------|-------|
| Method | `PUT` |
| URL | `{{BASE_URL}}/users/me` |
| Auth | Bearer `{{ACCESS_TOKEN}}` |
| Body (JSON) | See below |

```json
{
  "fullName": "John Updated",
  "address": "123 Main St, Bangalore",
  "pin": 560001
}
```

---

### Step 2.3 — List All Users *(admin only)*

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{BASE_URL}}/users?page=1&limit=20` |
| Auth | Bearer `{{ADMIN_TOKEN}}` |

---

## Module 3 — Bus

### Step 3.1 — Search Buses *(public)*

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{BASE_URL}}/buses?from=Bangalore&to=Mysore&date=2026-06-15` |
| Auth | None |

Optional query params: `&vehicleType=ac_seater&page=1&limit=20`

**Auto-save first bus ID** — add to **Tests** tab:
```javascript
const res = pm.response.json();
if (res.success && res.data.data.length > 0) {
  pm.environment.set("BUS_ID", res.data.data[0]._id);
}
```

---

### Step 3.2 — Get Bus by ID *(public)*

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{BASE_URL}}/buses/{{BUS_ID}}` |
| Auth | None |

---

### Step 3.3 — Get Available Seats *(public)*

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{BASE_URL}}/buses/{{BUS_ID}}/seats` |
| Auth | None |

---

### Step 3.4 — Create Bus *(operator / admin)*

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/buses` |
| Auth | Bearer `{{ADMIN_TOKEN}}` |
| Body (JSON) | See below |

```json
{
  "busNo": "KA01AB1234",
  "vehicleType": "ac_seater",
  "route": {
    "from": "Bangalore",
    "to": "Mysore",
    "stops": [
      { "name": "Mandya", "code": "MDY", "order": 1, "fareFromOrigin": 150 }
    ]
  },
  "departAt": "2026-06-15T08:00:00.000Z",
  "arriveAt": "2026-06-15T11:00:00.000Z",
  "totalSeats": 40,
  "baseFare": 350,
  "amenities": ["ac", "wifi", "charging_port"]
}
```

**Auto-save bus ID** — add to **Tests** tab:
```javascript
const res = pm.response.json();
if (res.success) {
  pm.environment.set("BUS_ID", res.data.bus._id);
}
```

---

### Step 3.5 — Update Bus *(operator / admin)*

| Field | Value |
|-------|-------|
| Method | `PUT` |
| URL | `{{BASE_URL}}/buses/{{BUS_ID}}` |
| Auth | Bearer `{{ADMIN_TOKEN}}` |
| Body (JSON) | `{ "status": "delayed", "baseFare": 400 }` |

---

### Step 3.6 — Delete Bus *(admin only)*

| Field | Value |
|-------|-------|
| Method | `DELETE` |
| URL | `{{BASE_URL}}/buses/{{BUS_ID}}` |
| Auth | Bearer `{{ADMIN_TOKEN}}` |

---

## Module 4 — Booking

> Requires `Authorization: Bearer {{ACCESS_TOKEN}}`  
> **First create a bus (Step 3.4) and note the seat numbers from Step 3.3**

### Step 4.1 — Create Booking

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/bookings` |
| Auth | Bearer `{{ACCESS_TOKEN}}` |
| Body (JSON) | See below |

```json
{
  "busId": "{{BUS_ID}}",
  "travelDate": "2026-06-15T00:00:00.000Z",
  "from": "Bangalore",
  "to": "Mysore",
  "passengers": [
    {
      "name": "John Doe",
      "age": 30,
      "gender": "male",
      "seatNo": "01"
    },
    {
      "name": "Jane Doe",
      "age": 28,
      "gender": "female",
      "seatNo": "02"
    }
  ]
}
```

**Auto-save booking ID** — add to **Tests** tab:
```javascript
const res = pm.response.json();
if (res.success) {
  pm.environment.set("BOOKING_ID", res.data.booking._id);
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "booking": {
      "bookingRef": "BB...",
      "pnrNumber": "XXXXXXXX",
      "status": "pending",
      "totalFare": 700
    }
  }
}
```

---

### Step 4.2 — Get My Bookings

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{BASE_URL}}/bookings/my` |
| Auth | Bearer `{{ACCESS_TOKEN}}` |

Optional filters: `?status=pending`, `?upcoming=true`, `?page=1&limit=10`

---

### Step 4.3 — Get Booking by ID

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{BASE_URL}}/bookings/{{BOOKING_ID}}` |
| Auth | Bearer `{{ACCESS_TOKEN}}` |

---

### Step 4.4 — Cancel Booking

| Field | Value |
|-------|-------|
| Method | `PATCH` |
| URL | `{{BASE_URL}}/bookings/{{BOOKING_ID}}/cancel` |
| Auth | Bearer `{{ACCESS_TOKEN}}` |
| Body (JSON) | `{ "reason": "Change of plans" }` |

---

### Step 4.5 — List All Bookings *(admin / operator)*

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{BASE_URL}}/bookings?page=1&limit=20` |
| Auth | Bearer `{{ADMIN_TOKEN}}` |

---

## Module 5 — Payment

> **Flow:** Create Booking → Initiate Payment → Verify Payment  
> The booking must be in `pending` status

### Step 5.1 — Initiate Payment

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/payments/initiate` |
| Auth | Bearer `{{ACCESS_TOKEN}}` |
| Body (JSON) | See below |

```json
{
  "bookingId": "{{BOOKING_ID}}",
  "method": "upi",
  "provider": "razorpay",
  "upiId": "john@paytm"
}
```

**Auto-save payment ID** — add to **Tests** tab:
```javascript
const res = pm.response.json();
if (res.success) {
  pm.environment.set("PAYMENT_ID", res.data.payment._id);
}
```

---

### Step 5.2 — Verify Payment *(simulates success)*

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/payments/verify` |
| Auth | Bearer `{{ACCESS_TOKEN}}` |
| Body (JSON) | See below |

```json
{
  "paymentId": "{{PAYMENT_ID}}",
  "providerReference": "pay_test_123456",
  "signature": "optional_hmac"
}
```

**After this:** booking status → `confirmed`, seats → `booked`, invoice PDF queued.

---

### Step 5.3 — Get Payment Details

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{BASE_URL}}/payments/{{PAYMENT_ID}}` |
| Auth | Bearer `{{ACCESS_TOKEN}}` |

---

### Step 5.4 — Initiate Refund *(admin only)*

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/payments/{{PAYMENT_ID}}/refund` |
| Auth | Bearer `{{ADMIN_TOKEN}}` |
| Body (JSON) | `{ "amount": 350, "reason": "Partial refund for cancellation" }` |

---

## Module 6 — Notification

### Step 6.1 — Get My Notifications

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{BASE_URL}}/notifications?page=1&limit=20` |
| Auth | Bearer `{{ACCESS_TOKEN}}` |

---

### Step 6.2 — Create Notification *(admin / operator)*

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{BASE_URL}}/notifications` |
| Auth | Bearer `{{ADMIN_TOKEN}}` |
| Body (JSON) | See below |

```json
{
  "title": "Service Disruption",
  "body": "Bus KA01AB1234 is delayed by 30 minutes due to traffic.",
  "type": "warning",
  "target": "all",
  "channels": ["in_app", "sms"]
}
```

Send to specific users:
```json
{
  "title": "Your ticket is confirmed",
  "body": "PNR: XXXXXXXX — Have a safe journey!",
  "type": "success",
  "target": "custom",
  "targetIds": ["{{USER_ID}}"],
  "channels": ["in_app"]
}
```

**Auto-save notification ID** — add to **Tests** tab:
```javascript
const res = pm.response.json();
if (res.success) {
  pm.environment.set("NOTIFICATION_ID", res.data.notification._id);
}
```

---

### Step 6.3 — Mark Notification as Read

| Field | Value |
|-------|-------|
| Method | `PATCH` |
| URL | `{{BASE_URL}}/notifications/{{NOTIFICATION_ID}}/read` |
| Auth | Bearer `{{ACCESS_TOKEN}}` |

---

### Step 6.4 — Delete Notification *(admin only)*

| Field | Value |
|-------|-------|
| Method | `DELETE` |
| URL | `{{BASE_URL}}/notifications/{{NOTIFICATION_ID}}` |
| Auth | Bearer `{{ADMIN_TOKEN}}` |

---

## Common Error Testing

Test these for each module to verify error handling:

### Missing Auth Token
Remove the `Authorization` header → expect **401**:
```json
{ "success": false, "code": "UNAUTHORIZED", "message": "Invalid or expired token" }
```

### Wrong Role
Use `{{ACCESS_TOKEN}}` (user role) on an admin-only endpoint → expect **403**:
```json
{ "success": false, "code": "FORBIDDEN", "message": "Role not allowed" }
```

### Invalid Request Body
Send `{ "phone": "123" }` to `/auth/send-otp` → expect **400**:
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "phone: Enter a valid 10-digit Indian mobile number"
}
```

### Resource Not Found
Use a fake ID like `507f1f77bcf86cd799439011` → expect **404**:
```json
{ "success": false, "code": "NOT_FOUND", "message": "Bus not found" }
```

### Rate Limit
Hit `/auth/send-otp` 11+ times in 15 min → expect **429**:
```json
{ "success": false, "code": "TOO_MANY_REQUESTS", "message": "Too many OTP attempts..." }
```

---

## Suggested Test Flow (End-to-End)

Run these in order for a full happy-path test:

```
1.  GET  /health                          → server up
2.  POST /auth/send-otp                   → get OTP from server logs
3.  POST /auth/verify-otp                 → save ACCESS_TOKEN, USER_ID
4.  POST /auth/complete-registration      → complete profile
5.  GET  /users/me                        → verify profile
6.  POST /auth/admin/login                → save ADMIN_TOKEN
7.  POST /auth/admin/create              → create an operator
8.  POST /buses  (with ADMIN_TOKEN)       → save BUS_ID
9.  GET  /buses?from=...&date=...        → search buses
10. GET  /buses/{{BUS_ID}}/seats         → check available seats
11. POST /bookings  (with ACCESS_TOKEN)   → save BOOKING_ID
12. GET  /bookings/my                     → verify booking appears
13. POST /payments/initiate              → save PAYMENT_ID
14. POST /payments/verify                → booking → confirmed
15. GET  /bookings/{{BOOKING_ID}}        → status = confirmed
16. POST /notifications  (ADMIN_TOKEN)   → save NOTIFICATION_ID
17. GET  /notifications                  → see notification
18. PATCH /notifications/.../read        → mark read
19. POST /auth/refresh-token             → get new tokens
20. POST /auth/logout                    → clean up
```

---

## Tips

- **Check server terminal** for OTP in dev mode (look for `[DEV] OTP for 9876543210: 123456`)
- **Bull Board** at `http://localhost:4001/admin/queues` — see email/invoice jobs queued after payment
- **Invoice PDF** generated at `http://localhost:4001/uploads/invoices/invoice-BB....pdf` after payment verifies
- Use Postman's **Collection Runner** to run the full end-to-end flow automatically
- Save the collection as `Bus Booking API` and export it for the team
