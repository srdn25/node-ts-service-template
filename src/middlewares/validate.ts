import { ZodError, type ZodSchema } from 'zod';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { StatusCodes } from '@/constants/types';
import { BaseError } from '@/libs/errors/Base.error';

export const validate =
  (schema: ZodSchema) =>
  (req: FastifyRequest, reply: FastifyReply, done: (error?: Error) => void): void => {
    try {
      schema.parse({
        headers: req.headers,
        params: req.params,
        query: req.query,
        body: req.body,
      });

      done();
    } catch (error) {
      if (error instanceof ZodError) {
        reply.status(StatusCodes.BAD_REQUEST).send({
          message: 'Validation Error',
          errors: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      
      if (error instanceof BaseError) {
        done(error);
        return;
      }

      reply.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid request' });
    }
  };
