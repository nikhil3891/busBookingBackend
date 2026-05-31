import { Request, Response, NextFunction } from 'express';
import { busService } from './bus.service';
import { AuthenticatedRequest } from '../../core/types';

export class BusController {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await busService.search(req.query as never, authReq.tenantId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bus = await busService.getById(req.params['id']!);
      res.json({ success: true, data: { bus } });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const bus = await busService.create(req.body, authReq.user.id, authReq.tenantId);
      res.status(201).json({ success: true, data: { bus } });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const bus = await busService.update(req.params['id']!, req.body, authReq.user.id);
      res.json({ success: true, data: { bus } });
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await busService.remove(req.params['id']!);
      res.json({ success: true, data: { message: 'Bus removed' } });
    } catch (err) {
      next(err);
    }
  }

  async getAvailableSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seats = await busService.getAvailableSeats(req.params['id']!);
      res.json({ success: true, data: { seats } });
    } catch (err) {
      next(err);
    }
  }
}

export const busController = new BusController();
