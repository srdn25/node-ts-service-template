import { Request, Response, NextFunction } from 'express';

const mockCatchAsyncImplementation = jest.fn();
const mockDatabaseErrorCatchImplementation = jest.fn();

jest.mock('../../../src/utils', () => ({
  catchAsync: () => mockCatchAsyncImplementation,
  DatabaseErrorCatch: () => mockDatabaseErrorCatchImplementation,
}));

describe('Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('catchAsync', () => {
    it('should properly call the decorated method', () => {
      const mockReq = {} as Request;
      const mockRes = {} as Response;
      const mockNext = jest.fn() as NextFunction;

      mockCatchAsyncImplementation(mockReq, mockRes, mockNext);

      expect(mockCatchAsyncImplementation).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        mockNext,
      );
    });
  });

  describe('DatabaseErrorCatch', () => {
    it('should properly call the decorated method', () => {
      const mockArgs = { id: '123' };

      mockDatabaseErrorCatchImplementation(mockArgs);

      expect(mockDatabaseErrorCatchImplementation).toHaveBeenCalledWith(
        mockArgs,
      );
    });
  });
});
