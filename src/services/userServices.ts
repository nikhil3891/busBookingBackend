import { Request, Response, NextFunction } from "express";
import { ok, error } from "../utility/response.helper";
import User from "../models/usersModel";

interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  email?: string;
  gender?: string;
  dob?: string;
  address?: string;
  pin?: string;
}

// ✅ Service: update user profile
// export async function updateUserProfile(userId: string, data: UpdateProfileData) {
//   const user = await User.findById(userId);
//   if (!user) throw new Error("User not found");

//   // Only update provided fields
//   Object.entries(data).forEach(([key, value]) => {
//     if (value !== undefined && value !== null && value !== "") {
//       (user as any)[key] = value;
//     }
//   });

//   await user.save();

//   // Return cleaned response
//   const safeUser = user.toObject();
//   delete safeUser.password;
//   delete safeUser.otp;
//   delete safeUser.refreshTokens;
//   delete safeUser.otpExpiresAt;

//   return safeUser;
// }

export const updateUserProfile = async (userId: string, updateData: UpdateProfileData) => {
  const allowedFields = ["fullName", "email", "gender", "dob", "address", "pin", "phone"];
  const filteredData: Partial<UpdateProfileData> = {};

  // Allow only defined fields
  allowedFields.forEach((field) => {
    if (updateData[field as keyof UpdateProfileData] !== undefined) {
      filteredData[field as keyof UpdateProfileData] =
        updateData[field as keyof UpdateProfileData];
    }
  });

  const updatedUser = await User.findByIdAndUpdate(userId, filteredData, {
    new: true,
  }).select("-password -otp -refreshTokens -otpExpiresAt");

  if (!updatedUser) throw new Error("User not found");
  return updatedUser;
};
