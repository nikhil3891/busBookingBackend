// src/routes/user.routes.ts
import { Router } from "express";
import { jwtAuth } from "../middlewares/authMiddleware";
import { body } from "express-validator";
import validate from "../middlewares/validationMiddleware";
import * as userController from "../controllers/userController";

const router = Router();

// ✅ Get current logged-in user profile
router.get("/get-user", jwtAuth, userController.getProfile);

// ✅ Update user profile (fullName, phone, email, gender, address, pin)
router.put(
  "/update-profile",
  jwtAuth,
   [
    body("fullName")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Full name must be at least 2 characters long"),

    body("email")
      .optional()
      .isEmail()
      .withMessage("Enter a valid email address"),

    body("phone")
      .optional()
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Enter a valid 10-digit Indian mobile number"),

    body("gender")
      .optional()
      .isIn(["male", "female", "other", "Male", "Female", "Other"])
      .withMessage("Gender must be Male, Female, or Other"),

    body("dob")
      .optional()
      .isString()
      .matches(/^(\d{4}-\d{2}-\d{2}|(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4})$/)
      .withMessage("DOB must be in DD-MM-YYYY format"),

    body("address")
      .optional()
      .isString()
      .isLength({ min: 3 })
      .withMessage("Address must be at least 3 characters long"),

    body("pin")
      .optional()
      .matches(/^\d{6}$/)
      .withMessage("PIN code must be a 6-digit number"),
  ],
  validate, // ✅ Run express-validator middleware
  userController.updateUserProfile
);

export default router;
