import { TYPES } from '@/constants/types';
import { BaseError } from '@/libs/errors/Base.error';
import type { TLogger } from '@/types/container';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import type { Container } from 'inversify';

export function notFoundHandler(container: Container) {
  const logger = container.get<TLogger>(TYPES.Logger);

  return (req: FastifyRequest, reply: FastifyReply): void => {
    const message = `Not Found - ${req.url}`;
    logger.debug(message);

    reply.status(404).send({ message });
  };
}

export function errorHandler(container: Container) {
  const logger = container.get<TLogger>(TYPES.Logger);

  return (
    err: Error | BaseError,
    req: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const isBaseError = err instanceof BaseError;
    let status = isBaseError ? err.status : 500;
    let message: object | string = isBaseError
      ? err.toResponse()
      : { message: err.message || 'Internal error' };

    // Handle Fastify JSON parsing errors
    if ((err as FastifyError).code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE') {
      status = 400;
      message = { message: 'Invalid JSON body' };
    }

    const errorToLog = err instanceof Error ? err : new Error(String(err));
    logger.warn(`ErrorHandler middleware [${status}]: `, errorToLog);

    reply.status(status).send(message);
  };
}
