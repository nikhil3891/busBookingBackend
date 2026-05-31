import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { AuthenticatedRequest } from '../../core/types';

export class NotificationController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const page = parseInt((req.query['page'] as string) ?? '1', 10);
      const limit = parseInt((req.query['limit'] as string) ?? '20', 10);
      const result = await notificationService.list(
        authReq.user.id,
        authReq.tenantId,
        page,
        limit,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const notification = await notificationService.create(
        req.body,
        authReq.user.id,
        authReq.tenantId,
      );
      res.status(201).json({ success: true, data: { notification } });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      await notificationService.markAsRead(req.params['id']!, authReq.user.id);
      res.json({ success: true, data: { message: 'Marked as read' } });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.delete(req.params['id']!);
      res.json({ success: true, data: { message: 'Notification deleted' } });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
