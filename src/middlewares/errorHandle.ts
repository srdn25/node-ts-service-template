import { BaseError } from '@/libs/errors/Base.error';
import type { NextFunction, Request, Response } from 'express';

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

export function errorHandler(
  err: Error | BaseError,
  req: Request,
  res: Response,
) {
  const isBaseError = err instanceof BaseError;
  const status = isBaseError ? err.status : 500;
  const message = isBaseError
    ? err.toResponse()
    : { message: 'Internal error' };
  res.status(status).json(message);
}
