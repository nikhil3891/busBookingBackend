// src/controllers/bus.controller.ts
import { Request, Response, NextFunction } from 'express';
import Bus from '../models/busModel';
import { ok, error } from '../utility/response.helper';


// create bus (admin/operator)
export async function createBus(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = req.body;
    payload.operatorId = (req.user as any)?._id || '000000000000000000000000';
    const bus = await Bus.create(payload);
    return ok(res, bus);
  } catch (err) { next(err); }
}

// update bus
export async function updateBus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const bus = await Bus.findByIdAndUpdate(id, req.body, { new: true });
    if (!bus) return error(res, 'Bus not found', 404);
    return ok(res, bus);
  } catch (err) { next(err); }
}

// list buses — supports filters: date(from departAt), from, to, status
export async function listBuses(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to, date } = req.query;
    const q: any = {};
    if (from) q['route.from'] = from;
    if (to) q['route.to'] = to;
    if (date) {
      const dt = new Date(String(date));
      const nextDay = new Date(dt); nextDay.setDate(dt.getDate() + 1);
      q.departAt = { $gte: dt, $lt: nextDay };
    }
    const buses = await Bus.find(q).sort({ departAt: 1 });
    return ok(res, buses);
  } catch (err) { next(err); }
}

// get single bus details
export async function getBus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const bus = await Bus.findById(id);
    if (!bus) return error(res, 'Bus not found', 404);
    return ok(res, bus);
  } catch (err) { next(err); }
}
// delete bus
export async function deleteBus(req: Request, res: Response, next: NextFunction) {
  try {     
    const { id } = req.params;
    const bus = await Bus.findByIdAndDelete(id);
    if (!bus) return error(res, 'Bus not found', 404);
    return ok(res, { message: 'Bus deleted' });
  } catch (err) { next(err); }
}
// Note: In a real-world app, deleting a bus should check for existing bookings etc.
  