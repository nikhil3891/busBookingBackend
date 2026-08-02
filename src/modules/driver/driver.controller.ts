import { Request, Response, NextFunction } from 'express';
import { driverService } from './driver.service';
import { AuthenticatedRequest } from '../../core/types';

export class DriverController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const driver = await driverService.create(req.body, authReq.user.id, authReq.tenantId!);
      res.status(201).json({ success: true, data: { driver } });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driver = await driverService.getById(req.params['id']!);
      res.json({ success: true, data: { driver } });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await driverService.list(req.query as never, authReq.tenantId, authReq.user.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driver = await driverService.update(req.params['id']!, req.body);
      res.json({ success: true, data: { driver } });
    } catch (err) {
      next(err);
    }
  }

  async assignManager(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { managerId } = req.body as { managerId: string };
      const driver = await driverService.assignManager(req.params['id']!, managerId, authReq.user.id);
      res.json({ success: true, data: { driver } });
    } catch (err) {
      next(err);
    }
  }

  async decide(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const driver = await driverService.decide(req.params['id']!, authReq.user.id, req.body);
      res.json({ success: true, data: { driver } });
    } catch (err) {
      next(err);
    }
  }
}

export const driverController = new DriverController();
