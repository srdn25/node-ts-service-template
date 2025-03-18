import {
  MongooseErrorHandler,
  MongooseErrorMappings,
} from '../../../../src/libs/errors/Database.error';
import { constants as HttpStatus } from 'node:http2';

describe('MongooseErrorHandler', () => {
  it('should handle known Mongoose errors with correct status and message', () => {
    // Test for CastError
    const castError = new Error();
    castError.name = 'CastError';

    const handler = new MongooseErrorHandler(castError);

    expect(handler.name).toBe('CastError');
    expect(handler.status).toBe(HttpStatus.HTTP_STATUS_BAD_REQUEST);
    expect(handler.message).toBe('Invalid data type provided.');
  });

  it('should handle ValidationError', () => {
    const validationError = new Error();
    validationError.name = 'ValidationError';

    const handler = new MongooseErrorHandler(validationError);

    expect(handler.name).toBe('ValidationError');
    expect(handler.status).toBe(HttpStatus.HTTP_STATUS_UNPROCESSABLE_ENTITY);
    expect(handler.message).toBe('Validation failed for the provided data.');
  });

  it('should handle DocumentNotFoundError', () => {
    const notFoundError = new Error();
    notFoundError.name = 'DocumentNotFoundError';

    const handler = new MongooseErrorHandler(notFoundError);

    expect(handler.name).toBe('DocumentNotFoundError');
    expect(handler.status).toBe(HttpStatus.HTTP_STATUS_NOT_FOUND);
    expect(handler.message).toBe('Requested document was not found.');
  });

  it('should handle unknown Mongoose errors with default status and message', () => {
    const unknownError = new Error();
    unknownError.name = 'SomeUnknownError';

    const handler = new MongooseErrorHandler(unknownError);

    expect(handler.name).toBe('SomeUnknownError');
    expect(handler.status).toBe(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR);
    expect(handler.message).toBe('An unknown Mongoose error occurred.');
  });

  it('should include custom details in the error', () => {
    const error = new Error();
    error.name = 'CastError';
    const details = {
      field: 'userId',
      value: 'invalid-id',
      attemptedOperation: 'find',
    };

    const handler = new MongooseErrorHandler(error, details);
    const response = handler.toResponse();

    expect(response.details).toEqual(details);
  });

  it('should have proper error mappings defined', () => {
    expect(MongooseErrorMappings).toBeDefined();
    expect(MongooseErrorMappings.CastError).toBeDefined();
    expect(MongooseErrorMappings.ValidationError).toBeDefined();
    expect(MongooseErrorMappings.DocumentNotFoundError).toBeDefined();
    expect(MongooseErrorMappings.MongooseServerSelectionError).toBeDefined();
  });
});
