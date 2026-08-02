import { Request, Response, NextFunction } from 'express';
import { grievanceService } from './grievance.service';
import { AuthenticatedRequest } from '../../core/types';

export class GrievanceController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const grievance = await grievanceService.create(req.body, authReq.user.id, authReq.tenantId);
      res.status(201).json({ success: true, data: { grievance } });
    } catch (err) {
      next(err);
    }
  }

  async listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await grievanceService.listMine(authReq.user.id, req.query as never);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listForStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await grievanceService.listForStaff(authReq.tenantId, req.query as never);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const grievance = await grievanceService.getById(req.params['id']!, authReq.user.id, authReq.user.role);
      res.json({ success: true, data: { grievance } });
    } catch (err) {
      next(err);
    }
  }

  async addMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { message } = req.body as { message: string };
      const grievance = await grievanceService.addMessage(
        req.params['id']!,
        authReq.user.id,
        authReq.user.role,
        message,
      );
      res.json({ success: true, data: { grievance } });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body as { status: 'open' | 'in_progress' | 'resolved' | 'closed' };
      const grievance = await grievanceService.updateStatus(req.params['id']!, status);
      res.json({ success: true, data: { grievance } });
    } catch (err) {
      next(err);
    }
  }
}

export const grievanceController = new GrievanceController();
