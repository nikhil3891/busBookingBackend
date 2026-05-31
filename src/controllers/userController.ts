// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/usersModel';
import { ok, error } from '../utility/response.helper';
import * as userService from "../services/userServices";

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as IUser;
    if (!user) return error(res, 'Unauthorized', 401);
    const fresh = await User.findById(user.id).select('-otp -otpExpiresAt -refreshTokens -password');
    return ok(res, fresh);
  } catch (err) { next(err); }
}

export async function updateUserProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as IUser;
    if (!user?._id) {
      return res.status(400).json({ success: false, message: "User not found or unauthorized" });
    }

    const updatedUser = await userService.updateUserProfile(user._id.toString(), req.body);
    console.log('Updated User:', updatedUser);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Error updating profile",
    });
  }
}

