// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authServices';
import { ok, error } from '../utility/response.helper';

export async function sendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = req.body;
    if (!phone) return error(res, 'phone required', 400);
    const r = await authService.sendOtp(phone);
    return ok(res, r);
  } catch (err) { next(err); }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return error(res, 'phone and otp required', 400);
    const r = await authService.verifyOtp(phone, otp);
    return ok(res, { user: r.user, access: r.access, refresh: r.refresh, profileRequired: r.profileRequired });
  } catch (err) { next(err); }
}

export async function completeRegistration(req: Request, res: Response, next: NextFunction) {
  try {
    // safer: get userId from req.user if protected route; here accept in body
    const { userId, fullName, gender, dob, email } = req.body;
    if (!userId || !fullName || !gender || !dob) return error(res, 'missing fields', 400);
    const r = await authService.completeRegistration(userId, { fullName, gender, dob, email });
    return ok(res, { user: r.user, access: r.access, refresh: r.refresh });
  } catch (err) { next(err); }
}
