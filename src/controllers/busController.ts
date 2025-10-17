// src/controllers/bus.controller.ts
import { Request, Response, NextFunction } from 'express';
import Bus from '../models/busModel';
import { ok, error } from '../utility/response.helper';

export async function createBus(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = req.body;
    payload.operatorId = req.user._id;
    const bus = await Bus.create(payload);
    return ok(res, bus);
  } catch (err) { next(err); }
}

export async function searchBuses(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to, date } = req.query;
    if (!from || !to) return error(res, 'from and to required', 400);
    const q: any = { 'route.from': from, 'route.to': to, status: 'active' };
    if (date) {
      const dt = new Date(String(date));
      const nextDay = new Date(dt); nextDay.setDate(dt.getDate() + 1);
      q.departAt = { $gte: dt, $lt: nextDay };
    }
    const buses = await Bus.find(q);
    return ok(res, buses);
  } catch (err) { next(err); }
}

export async function getBus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const bus = await Bus.findById(id);
    if (!bus) return error(res, 'Bus not found', 404);
    return ok(res, bus);
  } catch (err) { next(err); }
}
