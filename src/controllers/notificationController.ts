import { Request, Response, NextFunction } from 'express';
import Notification from '../models/notificationModel';
import { ok, error } from '../utility/response.helper';
import * as notificationService from '../services/notificationService';

// admin create notification
export async function createNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as any;
    const payload = req.body;
    payload.createdBy = user._id;
    const n = await notificationService.createNotification(payload);
    return ok(res, n);
  } catch (err) { next(err); }
}

// public get notifications for current user (or all)
export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as any; // optional
    const { onlyActive } = req.query;
    const items = await notificationService.listNotifications(user ? user._id : null, onlyActive === 'true');
    return ok(res, items);
  } catch (err) { next(err); }
}
// admin update notification
export async function updateNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const n = await notificationService.updateNotification(id, req.body);
    return ok(res, n);
  } catch (err) { next(err); }
}
// admin delete notification
export async function deleteNotification(req: Request, res: Response, next: NextFunction) {
  try { 
    const { id } = req.params;
    const r = await notificationService.deleteNotification(id);
    return ok(res, r);
  } catch (err) { next(err); }
}

