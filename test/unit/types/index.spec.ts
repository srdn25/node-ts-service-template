import { MongoObjectId, ErrorResponse } from '../../../src/types';
import { Types } from 'mongoose';

describe('Types', () => {
  describe('MongoObjectId', () => {
    it('should be the same as mongoose Types.ObjectId', () => {
      expect(MongoObjectId).toBe(Types.ObjectId);
    });

    it('should create valid ObjectId instances', () => {
      const id = new MongoObjectId();
      expect(Types.ObjectId.isValid(id)).toBe(true);
    });

    it('should create ObjectId from string', () => {
      const idString = '507f1f77bcf86cd799439011';
      const id = new MongoObjectId(idString);
      expect(id).toBeDefined();
      expect(Types.ObjectId.isValid(id)).toBe(true);
    });
  });

  describe('ErrorResponse interface', () => {
    it('should have the correct structure', () => {
      const errorResponse: ErrorResponse = {
        status: 400,
        message: 'Test error',
        details: { test: 'data' },
        error: 'TestError',
      };

      expect(errorResponse.status).toBe(400);
      expect(errorResponse.message).toBe('Test error');
      expect(errorResponse.details).toEqual({ test: 'data' });
      expect(errorResponse.error).toBe('TestError');
    });
  });
});
