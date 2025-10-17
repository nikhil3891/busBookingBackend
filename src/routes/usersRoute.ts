// src/routes/user.routes.ts
import { Router } from 'express';
import { jwtAuth } from '../middlewares/authMiddleware';
import { getProfile } from '../controllers/userController';

const router = Router();

router.get('/me', jwtAuth, getProfile);

export default router;
