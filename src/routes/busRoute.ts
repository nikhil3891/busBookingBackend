// src/routes/bus.routes.ts
import { Router } from 'express';
import { jwtAuth, requireRole } from '../middlewares/authMiddleware';
import { createBus, searchBuses, getBus } from '../controllers/busController';

const router = Router();

router.post('/', jwtAuth, requireRole('operator'), createBus); // operators create buses
router.get('/search', searchBuses);
router.get('/:id', getBus);

export default router;
