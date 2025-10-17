// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utility/logger';

export default function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // logger.error(err);
  const status = err.status || 500;
  res.status(status).json({ success: false, message: err.message || 'Internal Server Error', ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}) });
}
