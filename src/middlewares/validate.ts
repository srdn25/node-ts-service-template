import { ZodError, type ZodSchema } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from '@/constants/types';
import { BaseError } from '@/libs/errors/Base.error';

export const validate =
  <
    TParams = Record<string, unknown>,
    TQuery = Record<string, unknown>,
    TBody = Record<string, unknown>,
    THeaders = Record<string, unknown>,
  >(
    schema: ZodSchema,
  ) =>
  (
    req: Request<TParams, unknown, TBody, TQuery>,
    res: Response,
    next: NextFunction,
  ): void => {
    try {
      const validData = schema.parse({
        headers: req.headers,
        params: req.params,
        query: req.query,
        body: req.body,
      }) as { params: TParams; body: TBody; query: TQuery; headers: THeaders };

      req.params = validData.params;
      req.body = validData.body;
      req.query = validData.query;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Validation Error',
          errors: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      } else if (error instanceof BaseError) {
        throw error;
      }

      res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid request' });
    }
  };
