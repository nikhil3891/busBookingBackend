import { Notification, INotification } from './notification.model';
import { NotFoundError } from '../../core/errors/AppError';
import { eventBus } from '../../core/events/event.bus';
import { DomainEvent } from '../../core/events/event.types';
import { Types } from 'mongoose';
import { PaginatedResult } from '../../core/types';

export interface CreateNotificationDto {
  title: string;
  body: string;
  type?: 'info' | 'warning' | 'success' | 'error' | 'promo';
  target: 'all' | 'users' | 'operators' | 'bus' | 'custom';
  targetIds?: string[];
  channels?: string[];
  expiresAt?: Date;
  isPersistent?: boolean;
  metadata?: Record<string, unknown>;
}

export class NotificationService {
  async create(
    dto: CreateNotificationDto,
    createdById: string,
    tenantId?: string,
  ): Promise<INotification> {
    const notification = await Notification.create({
      ...dto,
      createdBy: new Types.ObjectId(createdById),
      targetIds: dto.targetIds?.map((id) => new Types.ObjectId(id)) ?? [],
      ...(tenantId ? { tenantId: new Types.ObjectId(tenantId) } : {}),
    });

    eventBus.emit(DomainEvent.NOTIFICATION_CREATED, {
      notificationId: notification.id,
      target: dto.target,
    });

    return notification;
  }

  async list(
    userId: string,
    tenantId: string | undefined,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<INotification>> {
    const userId_ = new Types.ObjectId(userId);
    const filter: Record<string, unknown> = {
      $or: [
        { target: 'all' },
        { target: 'users', targetIds: { $in: [userId_] } },
        { target: 'custom', targetIds: { $in: [userId_] } },
      ],
      ...(tenantId ? { tenantId: new Types.ObjectId(tenantId) } : {}),
    };

    const total = await Notification.countDocuments(filter);
    const data = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await Notification.updateOne(
      { _id: notificationId },
      { $addToSet: { readBy: new Types.ObjectId(userId) } },
    );
  }

  async delete(notificationId: string): Promise<void> {
    const n = await Notification.findByIdAndDelete(notificationId);
    if (!n) throw new NotFoundError('Notification');
  }
}

export const notificationService = new NotificationService();
