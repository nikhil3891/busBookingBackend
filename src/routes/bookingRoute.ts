// src/routes/booking.routes.ts
import { Router } from 'express';
import * as bookingCtrl from '../controllers/bookingController';
import { isAuth } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', isAuth, bookingCtrl.createBooking);
router.get('/', isAuth, bookingCtrl.getUserBookings); // ?upcoming=true
router.get('/:id', isAuth, bookingCtrl.getBooking);

export default router;
