import { ValidationError } from '../../../../src/libs/errors/Validation.error';
import { constants as HttpStatus } from 'node:http2';

describe('ValidationError', () => {
  const name = 'CustomValidationError';
  const message = 'Validation error message';
  const details = {
    field: 'email',
    error: 'Invalid email format',
  };

  it('should create an error with default details', () => {
    const error = new ValidationError(name, message);

    expect(error.name).toBe(name);
    expect(error.message).toBe(message);
    expect(error.status).toBe(HttpStatus.HTTP_STATUS_BAD_REQUEST);
  });

  it('should create an error with custom details', () => {
    const error = new ValidationError(name, message, details);

    expect(error.name).toBe(name);
    expect(error.message).toBe(message);
    expect(error.status).toBe(HttpStatus.HTTP_STATUS_BAD_REQUEST);
  });

  it('should convert to response format', () => {
    const error = new ValidationError(name, message, details);
    const response = error.toResponse();

    expect(response).toEqual({
      status: HttpStatus.HTTP_STATUS_BAD_REQUEST,
      message,
      details,
      error: name,
    });
  });
});
