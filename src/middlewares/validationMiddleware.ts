// src/middlewares/validation.middleware.ts
import { validationResult } from 'express-validator';

export default function validate(req: any, res: any, next: any) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
}
