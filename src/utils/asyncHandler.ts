import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * A centralized async error-handling wrapper for Express route handlers.
 * Resolves any returned Promise and automatically passes caught errors to next().
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
