import { Request, Response, NextFunction } from 'express';
import { planService } from './plan.service';

export class PlanController {
  async listActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await planService.listActive();
      res.json({ success: true, data: { plans } });
    } catch (err) {
      next(err);
    }
  }

  async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await planService.listAll();
      res.json({ success: true, data: { plans } });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await planService.getById(req.params['id']!);
      res.json({ success: true, data: { plan } });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await planService.create(req.body);
      res.status(201).json({ success: true, data: { plan } });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await planService.update(req.params['id']!, req.body);
      res.json({ success: true, data: { plan } });
    } catch (err) {
      next(err);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await planService.deactivate(req.params['id']!);
      res.json({ success: true, data: { plan } });
    } catch (err) {
      next(err);
    }
  }
}

export const planController = new PlanController();
