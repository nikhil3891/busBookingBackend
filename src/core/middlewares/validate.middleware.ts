import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../errors/AppError';

type ValidateTarget = 'body' | 'params' | 'query';

type RequestWithValidationState = Request & {
  __validated?: Record<string, unknown>;
};

function getRequestValue(req: RequestWithValidationState, target: ValidateTarget): unknown {
  if (!req.__validated) {
    req.__validated = {};
  }

  return req.__validated[target] ?? req[target];
}

function assignValidatedValue(req: RequestWithValidationState, target: ValidateTarget, value: unknown): void {
  if (!req.__validated) {
    req.__validated = {};
  }

  req.__validated[target] = value;
}

export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: RequestWithValidationState, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(getRequestValue(req, target));
      assignValidatedValue(req, target, parsed);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        next(new BadRequestError(messages, 'VALIDATION_ERROR'));
      } else {
        next(err);
      }
    }
  };
}
