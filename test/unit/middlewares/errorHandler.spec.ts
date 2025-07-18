import {
  errorHandler,
  notFoundHandler,
} from '../../../src/middlewares/errorHandler';
import { BaseError } from '../../../src/libs/errors/Base.error';
import { Container } from 'inversify';
import { TLogger } from '../../../src/types/container';
import { TYPES } from '../../../src/constants/types';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ValidationError } from '../../../src/libs/errors/Validation.error';

describe('Error Handlers', () => {
  let mockContainer: Container;
  let mockLogger: jest.Mocked<TLogger>;
  let mockRequest: Partial<FastifyRequest>;
  let mockResponse: Partial<FastifyReply>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<TLogger>;

    mockContainer = {
      get: jest.fn().mockReturnValue(mockLogger),
    } as unknown as Container;

    mockRequest = {
      url: '/test',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  describe('notFoundHandler', () => {
    it('should create a 404 error and send it', () => {
      const handler = notFoundHandler(mockContainer);

            handler(mockRequest as FastifyRequest, mockResponse as FastifyReply);

      expect(mockLogger.debug).toHaveBeenCalledWith('Not Found - /test');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: 'Not Found - /test' });
    });
  });

  describe('errorHandler', () => {
    it('should handle BaseError properly', () => {
      const handler = errorHandler(mockContainer);
      const error = new BaseError(
        'TestError',
        'Test message',
        { code: 123 },
        400,
      );

      handler(
        error,
        mockRequest as FastifyRequest,
        mockResponse as FastifyReply,
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'ErrorHandler middleware [400]: ',
        error,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({
        status: 400,
        message: 'Test message',
        details: { code: 123 },
        error: 'TestError',
      });
    });

    it('should handle ValidationError properly', () => {
      const handler = errorHandler(mockContainer);
      const error = new ValidationError('module', 'Validation failed', {
        field: 'password',
        reason: 'Password is too short',
      });

      handler(
        error,
        mockRequest as FastifyRequest,
        mockResponse as FastifyReply,
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'ErrorHandler middleware [400]: ',
        error,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({
        status: 400,
        message: 'Validation failed',
        details: {
          field: 'password',
          reason: 'Password is too short',
        },
        error: 'module',
      });
    });

    it('should handle regular Error with 500 status', () => {
      const handler = errorHandler(mockContainer);
      const error = new Error('Regular error');

      handler(
        error,
        mockRequest as FastifyRequest,
        mockResponse as FastifyReply,
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'ErrorHandler middleware [500]: ',
        error,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: 'Regular error',
      });
    });

    it('should handle Error without message', () => {
      const handler = errorHandler(mockContainer);
      const error = new Error();

      handler(
        error,
        mockRequest as FastifyRequest,
        mockResponse as FastifyReply,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: 'Internal error',
      });
    });

    it('should handle Error with custom properties', () => {
      const handler = errorHandler(mockContainer);
      const error = new Error('Custom error') as Error & {
        statusCode: number;
        details: Record<string, any>;
      };
      error.statusCode = 403;
      error.details = { reason: 'Forbidden access', resource: 'private-api' };

      handler(
        error,
        mockRequest as FastifyRequest,
        mockResponse as FastifyReply,
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'ErrorHandler middleware [500]: ',
        error,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: 'Custom error',
      });
    });
  });
});
