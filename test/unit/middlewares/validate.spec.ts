import { validate } from '../../../src/middlewares/validate';
import { z, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { BaseError } from '../../../src/libs/errors/Base.error';
import { StatusCodes } from '../../../src/constants/types';

describe('Validate Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {},
      query: {},
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe('validate schema', () => {
    it('should call next() when validation passes', () => {
      const schema = z.object({
        body: z.object({
          name: z.string(),
          email: z.string().email(),
        }),
        params: z.object({}),
        query: z.object({}),
        headers: z.object({}),
      });

      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should update request with validated data', () => {
      const schema = z.object({
        body: z.object({
          name: z.string().transform((val) => val.toUpperCase()),
          email: z.string().email(),
        }),
        params: z.object({}),
        query: z.object({}),
        headers: z.object({}),
      });

      mockRequest.body = {
        name: 'john doe',
        email: 'john@example.com',
      };

      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({
        name: 'JOHN DOE',
        email: 'john@example.com',
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 400 with errors when validation fails with ZodError', () => {
      const schema = z.object({
        body: z.object({
          name: z.string().min(3),
          email: z.string().email(),
          age: z.number().min(18),
        }),
        params: z.object({}),
        query: z.object({}),
        headers: z.object({}),
      });

      mockRequest.body = {
        name: 'Jo',
        email: 'not-an-email',
        age: 16,
      };

      const middleware = validate(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Validation Error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            path: expect.any(String),
            message: expect.any(String),
          }),
        ]),
      });
    });

    it('should throw BaseError when caught', () => {
      const mockSchema = {
        parse: jest.fn().mockImplementation(() => {
          throw new BaseError('TestError', 'Base error message', {}, 400);
        }),
      };

      const middleware = validate(mockSchema as unknown as z.ZodSchema);

      expect(() => {
        middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(BaseError);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for non-ZodError exceptions', () => {
      const mockSchema = {
        parse: jest.fn().mockImplementation(() => {
          throw new Error('Unexpected error');
        }),
      };

      const middleware = validate(mockSchema as unknown as z.ZodSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid request',
      });
    });
  });
});
