import { Request, Response, NextFunction } from 'express';
import { bookingService } from './booking.service';
import { AuthenticatedRequest, Role } from '../../core/types';

export class BookingController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const booking = await bookingService.createBooking(
        ((req as Request & { __validated?: Record<string, unknown> }).__validated?.body ?? req.body),
        authReq.user.id,
        authReq.tenantId,
      );
      res.status(201).json({ success: true, data: { booking } });
    } catch (err) {
      next(err);
    }
  }

  async getMyBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await bookingService.listUserBookings(
        authReq.user.id,
        ((req as Request & { __validated_query?: unknown }).__validated_query ?? req.query) as never,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATOR].includes(
        authReq.user.role as Role,
      );
      const booking = await bookingService.getBooking(
        req.params['id']!,
        authReq.user.id,
        isAdmin,
      );
      res.json({ success: true, data: { booking } });
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(authReq.user.role as Role);
      const booking = await bookingService.cancelBooking(
        req.params['id']!,
        authReq.user.id,
        (((req as Request & { __validated?: Record<string, unknown> }).__validated?.body as { reason?: string } | undefined)?.reason ?? (req.body as { reason?: string } | undefined)?.reason),
        isAdmin,
      );
      res.json({ success: true, data: { booking } });
    } catch (err) {
      next(err);
    }
  }

  async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await bookingService.listAllBookings(
        ((req as Request & { __validated_query?: unknown }).__validated_query ?? req.query) as never,
        authReq.tenantId,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const bookingController = new BookingController();
