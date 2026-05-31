// src/routes/auth.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validationMiddleware';
import { 
  sendOtp, 
  sendOtpForRegistration, 
  sendOtpForLogin, 
  verifyOtp, 
  completeRegistration, 
  logoutUser, 
  logoutAllDevicesUser 
} from '../controllers/authController';
import * as authController from '../controllers/authController';

const router = Router();

// Legacy endpoint (backward compatibility)
router.post('/send-otp', [body('phone').isString().notEmpty()], validate, sendOtp);

// New separate endpoints
router.post('/register/send-otp', [body('phone').isString().notEmpty()], validate, sendOtpForRegistration);
router.post('/login/send-otp', [body('phone').isString().notEmpty()], validate, sendOtpForLogin);

router.post('/verify-otp', [body('phone').isString().notEmpty(), body('otp').isString().notEmpty()], validate, verifyOtp);
router.post('/complete-registration', [
  body('userId').isString().notEmpty(),
  body('fullName').isString().notEmpty(),
  body('gender').isIn(['male','female','other']),
  body('dob').isISO8601()
], validate, completeRegistration);
router.post('/logout', logoutUser);
router.post('/logout-all', logoutAllDevicesUser);
router.post('/refresh-token', authController.refreshAccessToken);

export default router;
