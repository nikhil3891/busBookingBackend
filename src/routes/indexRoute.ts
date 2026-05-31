// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './authRoutes';
import adminRoutes from './adminRoutes';
import userRoutes from './usersRoute';
import busRoutes from './busRoute';
import bookingRoutes from './bookingRoute';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/buses', busRoutes);
router.use('/bookings', bookingRoutes);

export default router;
