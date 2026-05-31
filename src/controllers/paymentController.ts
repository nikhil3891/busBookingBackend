import { Request, Response, NextFunction } from 'express';
import { ok, error } from '../utility/response.helper';
import * as paymentService from '../services/paymentService';

export async function payWithUpi(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as any;
    const { bookingId, upiId } = req.body;
    if (!bookingId || !upiId) return error(res, 'bookingId and upiId required', 400);

    const r = await paymentService.processUpiPayment(user._id, bookingId, upiId);
    return ok(res, r);
  } catch (err) { next(err); }
}
