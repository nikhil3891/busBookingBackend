// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import User from '../models/usersModel';
import { ok, error } from '../utility/response.helper';

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return error(res, 'Unauthorized', 401);
    const fresh = await User.findById(user._id).select('-otp -otpExpiresAt -refreshTokens -password');
    return ok(res, fresh);
  } catch (err) { next(err); }
}
