import { Request } from 'express';
import { Types } from 'mongoose';

export type ObjectId = Types.ObjectId;

export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  SUPER_ADMIN = 'super_admin',
  Manager = 'manager',
  Driver = 'driver',
  Conductor = 'conductor',
}

export enum Permission {
  // User permissions
  READ_PROFILE = 'read:profile',
  UPDATE_PROFILE = 'update:profile',

  // Booking permissions
  CREATE_BOOKING = 'create:booking',
  READ_OWN_BOOKING = 'read:own_booking',
  READ_ALL_BOOKINGS = 'read:all_bookings',
  CANCEL_OWN_BOOKING = 'cancel:own_booking',
  CANCEL_ANY_BOOKING = 'cancel:any_booking',

  // Bus permissions
  READ_BUS = 'read:bus',
  CREATE_BUS = 'create:bus',
  UPDATE_BUS = 'update:bus',
  DELETE_BUS = 'delete:bus',

  // Payment permissions
  INITIATE_PAYMENT = 'initiate:payment',
  READ_OWN_PAYMENT = 'read:own_payment',
  READ_ALL_PAYMENTS = 'read:all_payments',
  REFUND_PAYMENT = 'refund:payment',

  // Notification permissions
  READ_NOTIFICATIONS = 'read:notifications',
  CREATE_NOTIFICATION = 'create:notification',
  DELETE_NOTIFICATION = 'delete:notification',

  // Admin permissions
  MANAGE_USERS = 'manage:users',
  MANAGE_TENANTS = 'manage:tenants',
  VIEW_ANALYTICS = 'view:analytics',
  MANAGE_OPERATORS = 'manage:operators',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.READ_PROFILE,
    Permission.UPDATE_PROFILE,
    Permission.CREATE_BOOKING,
    Permission.READ_OWN_BOOKING,
    Permission.CANCEL_OWN_BOOKING,
    Permission.INITIATE_PAYMENT,
    Permission.READ_OWN_PAYMENT,
    Permission.READ_NOTIFICATIONS,
    Permission.READ_BUS,
  ],
  [Role.OPERATOR]: [
    Permission.READ_PROFILE,
    Permission.UPDATE_PROFILE,
    Permission.CREATE_BUS,
    Permission.UPDATE_BUS,
    Permission.READ_BUS,
    Permission.READ_ALL_BOOKINGS,
    Permission.READ_ALL_PAYMENTS,
    Permission.READ_NOTIFICATIONS,
    Permission.CREATE_NOTIFICATION,
    Permission.VIEW_ANALYTICS,
  ],
  [Role.ADMIN]: [
    Permission.READ_PROFILE,
    Permission.UPDATE_PROFILE,
    Permission.MANAGE_USERS,
    Permission.CREATE_BUS,
    Permission.UPDATE_BUS,
    Permission.DELETE_BUS,
    Permission.READ_BUS,
    Permission.READ_ALL_BOOKINGS,
    Permission.CANCEL_ANY_BOOKING,
    Permission.READ_ALL_PAYMENTS,
    Permission.REFUND_PAYMENT,
    Permission.READ_NOTIFICATIONS,
    Permission.CREATE_NOTIFICATION,
    Permission.DELETE_NOTIFICATION,
    Permission.MANAGE_OPERATORS,
    Permission.VIEW_ANALYTICS,
  ],
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.Manager]: [
    Permission.READ_PROFILE,
    Permission.UPDATE_PROFILE,
    Permission.READ_BUS,
    Permission.READ_ALL_BOOKINGS,
    Permission.READ_ALL_PAYMENTS,
    Permission.READ_NOTIFICATIONS,
  ],
  [Role.Driver]: [
    Permission.READ_PROFILE,
    Permission.UPDATE_PROFILE,
    Permission.READ_BUS,
    Permission.READ_ALL_BOOKINGS,
    Permission.READ_NOTIFICATIONS,
  ],
  [Role.Conductor]: [
    Permission.READ_PROFILE,
    Permission.UPDATE_PROFILE,
    Permission.READ_BUS,
    Permission.READ_ALL_BOOKINGS,
    Permission.READ_NOTIFICATIONS,
  ],
};

export interface AuthenticatedRequest extends Request {
  user: {
    _id: ObjectId;
    id: string;
    role: Role;
    tenantId?: string;
    phone: string;
    email?: string;
    fullName?: string;
    isVerified: boolean;
    profileCompleted: boolean;
  };
  tenantId?: string;
  deviceId?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}
