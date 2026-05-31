// src/routes/admin.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middlewares/validationMiddleware';
import { jwtAuth, requireRole } from '../middlewares/authMiddleware';
import { 
  createAdminController, 
  adminLoginController, 
  setAdminPasswordController 
} from '../controllers/authController';

const router = Router();

// Admin login (public endpoint)
router.post('/login', [
  body('phone').isString().notEmpty(),
  body('password').isString().notEmpty()
], validate, adminLoginController);

// Admin management (protected routes)
router.post('/create', [
  // jwtAuth,
  requireRole('admin'),
  body('phone').isString().notEmpty(),
  body('fullName').isString().notEmpty(),
  body('role').isIn(['admin', 'operator']),
  body('email').optional().isEmail()
], validate, createAdminController);

router.post('/set-password', [
  // jwtAuth,
  requireRole('admin'),
  body('adminId').isString().notEmpty(),
  body('password').isString().isLength({ min: 6 })
], validate, setAdminPasswordController);

export default router;



