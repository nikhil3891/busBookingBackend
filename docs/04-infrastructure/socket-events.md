# Socket.IO Real-Time Events

## Connection

```javascript
// Client connection with JWT auth
const socket = io('http://localhost:4001', {
  auth: { token: 'Bearer eyJ...' },
  transports: ['websocket', 'polling']
});
```

## Rooms

| Room | Description | Auto-join |
|------|-------------|-----------|
| `user:<userId>` | Personal notifications | ✅ On connect (if authenticated) |
| `tenant:<tenantId>` | Tenant-wide events | ✅ On connect (if tenantId in JWT) |
| `bus:<busId>` | Seat updates for a bus | Client must join: `socket.emit('join:bus', busId)` |

## Server → Client Events

| Event | Payload | When |
|-------|---------|------|
| `booking:update` | `{ bookingId, status }` | Booking confirmed/cancelled |
| `payment:update` | `{ paymentId, status }` | Payment success/failure |
| `bus:status` | `{ busId, status }` | Bus delayed/cancelled/boarding |
| `seat:locked` | `{ busId, seats[] }` | Seats locked by another user |
| `seat:available` | `{ busId, seats[] }` | Locked seats released |
| `notification:new` | `{ notificationId }` | New notification created |

## Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join:bus` | `busId: string` | Subscribe to bus seat updates |
| `leave:bus` | `busId: string` | Unsubscribe |

## Client Usage Example

```javascript
// Join a bus room for live seat availability
socket.emit('join:bus', '507f1f77bcf86cd799439011');

socket.on('seat:locked', ({ busId, seats }) => {
  // Gray out locked seats in UI
  seats.forEach(seat => markSeatLocked(seat));
});

socket.on('booking:update', ({ bookingId, status }) => {
  // Show toast: "Booking confirmed!"
  showToast(`Booking ${status}`);
});

// On payment page
socket.on('payment:update', ({ status }) => {
  if (status === 'success') navigateToConfirmation();
  else showPaymentError();
});
```
