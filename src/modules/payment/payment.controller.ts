import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { AuthenticatedRequest, Role } from '../../core/types';

export class PaymentController {
  async initiate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const payment = await paymentService.initiatePayment(
        req.body,
        authReq.user.id,
        authReq.tenantId,
      );
      res.status(201).json({ success: true, data: { payment } });
    } catch (err) {
      next(err);
    }
  }

  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const payment = await paymentService.verifyPayment(req.body, authReq.user.id);
      res.json({ success: true, data: { payment } });
    } catch (err) {
      next(err);
    }
  }

  async refund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const payment = await paymentService.initiateRefund(
        req.params['id']!,
        req.body,
        authReq.user.id,
      );
      res.json({ success: true, data: { payment } });
    } catch (err) {
      next(err);
    }
  }

  async getPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(authReq.user.role as Role);
      const payment = await paymentService.getPayment(
        req.params['id']!,
        authReq.user.id,
        isAdmin,
      );
      res.json({ success: true, data: { payment } });
    } catch (err) {
      next(err);
    }
  }
}

export const paymentController = new PaymentController();
