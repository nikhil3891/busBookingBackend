import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import busRoutes from '../modules/bus/bus.routes';
import bookingRoutes from '../modules/booking/booking.routes';
import paymentRoutes from '../modules/payment/payment.routes';
import notificationRoutes from '../modules/notification/notification.routes';
import { tenantMiddleware } from '../core/middlewares/tenant.middleware';

const router = Router();

// Tenant detection on all routes
router.use(tenantMiddleware);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', userRoutes); // Admin routes can be the same as user routes but with different permissions
router.use('/buses', busRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);

export default router;
