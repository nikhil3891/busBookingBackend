import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../core/config/env.config';
import { eventBus } from '../core/events/event.bus';
import { DomainEvent } from '../core/events/event.types';
import { logger } from '../core/logger/logger';
import { JwtPayload } from '../modules/auth/auth.types';

export enum SocketEvent {
  BOOKING_UPDATE = 'booking:update',
  PAYMENT_UPDATE = 'payment:update',
  BUS_STATUS = 'bus:status',
  SEAT_LOCKED = 'seat:locked',
  SEAT_AVAILABLE = 'seat:available',
  NOTIFICATION = 'notification:new',
  ERROR = 'error',
}

let io: SocketServer;

export function initSocketGateway(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: {
      origin: env.cors.origins,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // JWT authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.['token'] as string | undefined
      ?? (socket.handshake.headers['authorization'] as string | undefined)?.replace('Bearer ', '');

    if (!token) {
      socket.data['anonymous'] = true;
      return next();
    }

    try {
      const payload = jwt.verify(token, env.jwt.secret) as JwtPayload;
      socket.data['userId'] = payload.sub;
      socket.data['role'] = payload.role;
      socket.data['tenantId'] = payload.tenantId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data['userId'] as string | undefined;
    const tenantId = socket.data['tenantId'] as string | undefined;

    if (userId) {
      void socket.join(`user:${userId}`);
      logger.debug(`[Socket] User ${userId} connected`);
    }

    if (tenantId) {
      void socket.join(`tenant:${tenantId}`);
    }

    // Join bus room for real-time seat updates
    socket.on('join:bus', (busId: string) => {
      void socket.join(`bus:${busId}`);
    });

    socket.on('leave:bus', (busId: string) => {
      void socket.leave(`bus:${busId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`[Socket] User ${userId ?? 'anonymous'} disconnected`);
    });
  });

  // Bridge domain events → socket events
  registerEventBridges();

  logger.info('[Socket] Socket.IO gateway initialized');
  return io;
}

function registerEventBridges(): void {
  eventBus.on(DomainEvent.BOOKING_CONFIRMED, ({ bookingId, userId }) => {
    io.to(`user:${userId}`).emit(SocketEvent.BOOKING_UPDATE, {
      bookingId,
      status: 'confirmed',
    });
  });

  eventBus.on(DomainEvent.BOOKING_CANCELLED, ({ bookingId, userId }) => {
    io.to(`user:${userId}`).emit(SocketEvent.BOOKING_UPDATE, {
      bookingId,
      status: 'cancelled',
    });
  });

  eventBus.on(DomainEvent.PAYMENT_SUCCESS, ({ paymentId, bookingId }) => {
    io.to(`booking:${bookingId}`).emit(SocketEvent.PAYMENT_UPDATE, {
      paymentId,
      status: 'success',
    });
  });

  eventBus.on(DomainEvent.PAYMENT_FAILED, ({ paymentId, bookingId }) => {
    io.to(`booking:${bookingId}`).emit(SocketEvent.PAYMENT_UPDATE, {
      paymentId,
      status: 'failed',
    });
  });

  eventBus.on(DomainEvent.SEAT_LOCKED, ({ busId, seats }) => {
    io.to(`bus:${busId}`).emit(SocketEvent.SEAT_LOCKED, { busId, seats });
  });

  eventBus.on(DomainEvent.BUS_STATUS_CHANGED, ({ busId, status }) => {
    io.to(`bus:${busId}`).emit(SocketEvent.BUS_STATUS, { busId, status });
  });

  eventBus.on(DomainEvent.NOTIFICATION_CREATED, ({ notificationId }) => {
    io.emit(SocketEvent.NOTIFICATION, { notificationId });
  });
}

export function getSocketServer(): SocketServer {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
