// src/routes/auth.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validationMiddleware';
import { sendOtp, verifyOtp, completeRegistration } from '../controllers/authControlle';

const router = Router();

router.post('/send-otp', [body('phone').isString().notEmpty()], validate, sendOtp);
router.post('/verify-otp', [body('phone').isString().notEmpty(), body('otp').isString().notEmpty()], validate, verifyOtp);
router.post('/complete-registration', [
  body('userId').isString().notEmpty(),
  body('fullName').isString().notEmpty(),
  body('gender').isIn(['male','female','other']),
  body('dob').isISO8601()
], validate, completeRegistration);

export default router;
