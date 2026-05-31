export enum DomainEvent {
  // Auth events
  USER_REGISTERED = 'user.registered',
  USER_LOGGED_IN = 'user.logged_in',
  USER_LOGGED_OUT = 'user.logged_out',
  OTP_REQUESTED = 'otp.requested',
  OTP_VERIFIED = 'otp.verified',

  // Booking events
  BOOKING_CREATED = 'booking.created',
  BOOKING_CONFIRMED = 'booking.confirmed',
  BOOKING_CANCELLED = 'booking.cancelled',
  SEAT_LOCKED = 'seat.locked',
  SEAT_UNLOCKED = 'seat.unlocked',

  // Payment events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_SUCCESS = 'payment.success',
  PAYMENT_FAILED = 'payment.failed',
  REFUND_INITIATED = 'refund.initiated',
  REFUND_SUCCESS = 'refund.success',

  // Bus events
  BUS_CREATED = 'bus.created',
  BUS_UPDATED = 'bus.updated',
  BUS_STATUS_CHANGED = 'bus.status_changed',

  // Notification events
  NOTIFICATION_CREATED = 'notification.created',

  // Tenant events
  TENANT_CREATED = 'tenant.created',
  TENANT_SUSPENDED = 'tenant.suspended',
}

export interface DomainEventPayload {
  [DomainEvent.USER_REGISTERED]: {
    userId: string;
    phone: string;
    tenantId?: string;
  };
  [DomainEvent.USER_LOGGED_IN]: {
    userId: string;
    phone: string;
    tenantId?: string;
  };
  [DomainEvent.USER_LOGGED_OUT]: { userId: string };
  [DomainEvent.OTP_REQUESTED]: { phone: string; otp: string };
  [DomainEvent.OTP_VERIFIED]: { phone: string; userId: string };

  [DomainEvent.BOOKING_CREATED]: {
    bookingId: string;
    userId: string;
    busId: string;
    totalFare: number;
    tenantId?: string;
  };
  [DomainEvent.BOOKING_CONFIRMED]: {
    bookingId: string;
    userId: string;
    paymentId: string;
  };
  [DomainEvent.BOOKING_CANCELLED]: {
    bookingId: string;
    userId: string;
    reason?: string;
  };
  [DomainEvent.SEAT_LOCKED]: {
    busId: string;
    seats: string[];
    userId: string;
  };
  [DomainEvent.SEAT_UNLOCKED]: { busId: string; seats: string[] };

  [DomainEvent.PAYMENT_INITIATED]: {
    paymentId: string;
    bookingId: string;
    amount: number;
  };
  [DomainEvent.PAYMENT_SUCCESS]: {
    paymentId: string;
    bookingId: string;
    amount: number;
  };
  [DomainEvent.PAYMENT_FAILED]: {
    paymentId: string;
    bookingId: string;
    reason: string;
  };
  [DomainEvent.REFUND_INITIATED]: {
    paymentId: string;
    bookingId: string;
    amount: number;
  };
  [DomainEvent.REFUND_SUCCESS]: { paymentId: string; amount: number };

  [DomainEvent.BUS_CREATED]: { busId: string; tenantId?: string };
  [DomainEvent.BUS_UPDATED]: { busId: string };
  [DomainEvent.BUS_STATUS_CHANGED]: { busId: string; status: string };

  [DomainEvent.NOTIFICATION_CREATED]: {
    notificationId: string;
    target: string;
  };

  [DomainEvent.TENANT_CREATED]: { tenantId: string; name: string };
  [DomainEvent.TENANT_SUSPENDED]: { tenantId: string };
}
