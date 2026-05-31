// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authServices';
import { ok, error } from '../utility/response.helper';
import { logout, logoutAllDevices, createAdmin, adminLogin, setAdminPassword } from '../services/authServices';

export async function sendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = req.body;
    if (!phone) return error(res, 'phone required', 400);
    const r = await authService.sendOtp(phone);
    return ok(res, r);
  } catch (err) { next(err); }
}

// New separate registration endpoint
export async function sendOtpForRegistration(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = req.body;
    if (!phone) return error(res, 'phone required', 400);
    const r = await authService.sendOtpForRegistration(phone);
    return ok(res, r);
  } catch (err) { next(err); }
}

// New separate login endpoint
export async function sendOtpForLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = req.body;
    if (!phone) return error(res, 'phone required', 400);
    const r = await authService.sendOtpForLogin(phone);
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
    return ok(res, r); // r now only contains user and message
  } catch (err) { next(err); }
}

export async function logoutUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, refreshToken } = req.body;
    if (!userId || !refreshToken) return error(res, 'userId and refreshToken required', 400);
    const r = await logout(userId, refreshToken);
    return ok(res, r);
  } catch (err) { next(err); }
}

export async function logoutAllDevicesUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.body;
    if (!userId) return error(res, 'userId required', 400);
    const r = await logoutAllDevices(userId);
    return ok(res, r);
  } catch (err) { next(err); }
}

export async function refreshAccessToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, refreshToken } = req.body;
    if (!userId || !refreshToken) return error(res, 'userId and refreshToken required', 400);

    const r = await authService.refreshAccessToken(userId, refreshToken);
    return ok(res, r);
  } catch (err) { next(err); }
}

// ------------------ ADMIN CONTROLLERS --------------------

export async function createAdminController(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, fullName, email, role } = req.body;
    const createdBy = (req.user as any)?._id?.toString(); // From JWT token

    if (!phone || !fullName || !role) {
      return error(res, 'phone, fullName, and role are required', 400);
    }

    if (!['admin', 'operator'].includes(role)) {
      return error(res, 'role must be admin or operator', 400);
    }

    const r = await createAdmin({ phone, fullName, email, role, createdBy });
    return ok(res, r);
  } catch (err) { next(err); }
}

export async function adminLoginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return error(res, 'phone and password required', 400);

    const r = await adminLogin(phone, password);
    return ok(res, r);
  } catch (err) { next(err); }
}

export async function setAdminPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const { adminId, password } = req.body;
    if (!adminId || !password) return error(res, 'adminId and password required', 400);

    const r = await setAdminPassword(adminId, password);
    return ok(res, r);
  } catch (err) { next(err); }
}

