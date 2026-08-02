import { Request } from 'express';
import { BadRequestError } from '../errors/AppError';

/**
 * Express 5's @types/express (5.0.x) types req.params values as
 * `string | string[]` (to allow repeated path segments), so reading
 * a route param directly and using it as a plain `string` no longer
 * compiles under `strict: true`.
 *
 * Route params in this codebase are never intentionally arrays, so
 * this helper narrows safely: takes the first value if an array ever
 * shows up (defensive, shouldn't happen for our routes), and throws a
 * proper 400 if the param is missing instead of a non-null assertion
 * masking a bug.
 */
export function getParam(req: Request, key: string): string {
  const value = req.params[key];

  if (Array.isArray(value)) {
    const first = value[0];
    if (!first) {
      throw new BadRequestError(`Missing required route parameter: ${key}`);
    }
    return first;
  }

  if (!value) {
    throw new BadRequestError(`Missing required route parameter: ${key}`);
  }

  return value;
}
