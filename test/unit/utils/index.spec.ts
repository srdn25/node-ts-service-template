import { DatabaseErrorCatch } from '../../../src/utils';
import { BaseError } from '../../../src/libs/errors/Base.error';
import { MongooseError } from 'mongoose';
import { ValidationError } from '../../../src/libs/errors/Validation.error';
import { MongooseErrorHandler } from '../../../src/libs/errors/Database.error';

describe('DatabaseErrorCatch', () => {
  class TestClass {
    @DatabaseErrorCatch
    async testMethod(shouldThrow: boolean, errorType?: string): Promise<string> {
      if (shouldThrow) {
        if (errorType === 'BaseError') {
          throw new BaseError('BaseError', 'Test BaseError', {}, 400);
        } else if (errorType === 'ValidationError') {
          const validationError = new MongooseError('Validation failed');
          validationError.name = 'ValidationError';
          throw validationError;
        } else {
          throw new Error('Generic Error');
        }
      }
      return 'success';
    }
  }

  let testInstance: TestClass;

  beforeEach(() => {
    testInstance = new TestClass();
  });

  it('should return success if no error is thrown', async () => {
    await expect(testInstance.testMethod(false)).resolves.toBe('success');
  });

  it('should re-throw BaseError instances', async () => {
    await expect(testInstance.testMethod(true, 'BaseError')).rejects.toBeInstanceOf(BaseError);
  });

  it('should catch and re-throw Mongoose ValidationError as MongooseErrorHandler', async () => {
    await expect(testInstance.testMethod(true, 'ValidationError')).rejects.toBeInstanceOf(MongooseErrorHandler);
  });

  it('should catch and re-throw generic errors as MongooseErrorHandler', async () => {
    await expect(testInstance.testMethod(true)).rejects.toBeInstanceOf(MongooseErrorHandler);
  });
});

// TODO: Add tests for catchAsync once it's implemented in src/utils/index.ts