import { TYPES } from '@/constants/types';
import { BaseError } from '@/libs/errors/Base.error';
import type { TLogger } from '@/types/container';
import type { NextFunction, Request, Response } from 'express';
import type { Container } from 'inversify';

export function notFoundHandler(container: Container) {
  const logger = container.get<TLogger>(TYPES.Logger);

  return (req: Request, res: Response, next: NextFunction): void => {
    const message = `Not Found - ${req.originalUrl}`;
    const error = new Error(message);
    logger.debug(message);

    res.status(404);
    next(error);
  };
}

export function errorHandler(container: Container) {
  const logger = container.get<TLogger>(TYPES.Logger);

  return (
    err: Error | BaseError,
    req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    const isBaseError = err instanceof BaseError;
    const status = isBaseError ? err.status : 500;
    logger.warn(`ErrorHandler middleware [${status}]: `, err);

    const message = isBaseError
      ? err.toResponse()
      : { message: err.message || 'Internal error' };
    res.status(status).json(message);
  };
}
