// src/routes/booking.routes.ts
import { Router } from 'express';
import { jwtAuth } from '../middlewares/authMiddleware';
import { createBooking } from '../controllers/bookingControlle';

const router = Router();

router.post('/', jwtAuth, createBooking);

export default router;
