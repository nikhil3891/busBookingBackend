import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { logger } from '../logger/logger';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code ?? 'ERROR',
      message: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: err.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      code: 'MONGOOSE_VALIDATION_ERROR',
      message: 'Data validation failed',
      errors,
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      code: 'INVALID_ID',
      message: `Invalid ${err.path}: ${err.value}`,
    });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((err as any).code === 11000) {
    const keyValue = (err as any).keyValue as Record<string, unknown>;
    const field = Object.keys(keyValue ?? {})[0] ?? 'field';
    res.status(409).json({
      success: false,
      code: 'DUPLICATE_KEY',
      message: `${field} already exists`,
    });
    return;
  }

  logger.error('Unhandled error', {
    err: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
    req: {
      method: req.method,
      url: req.url,
      body: req.body,
      ip: req.ip,
    },
  });

  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'Something went wrong. Please try again later.',
  });
}
