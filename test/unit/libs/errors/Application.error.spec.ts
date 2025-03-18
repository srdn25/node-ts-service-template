import { ApplicationError } from '../../../../src/libs/errors/Application.error';
import { constants as HttpStatus } from 'node:http2';

describe('ApplicationError', () => {
  const name = 'CustomApplicationError';
  const message = 'Application error message';
  const details = { code: 'APPLICATION_ERROR' };

  it('should create an error with default status', () => {
    const error = new ApplicationError(name, message);

    expect(error.name).toBe(name);
    expect(error.message).toBe(message);
    expect(error.status).toBe(HttpStatus.HTTP_STATUS_BAD_REQUEST);
  });

  it('should create an error with custom status and details', () => {
    const status = HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR;
    const error = new ApplicationError(name, message, status, details);

    expect(error.name).toBe(name);
    expect(error.message).toBe(message);
    expect(error.status).toBe(status);
  });

  it('should convert to response format', () => {
    const error = new ApplicationError(name, message, undefined, details);
    const response = error.toResponse();

    expect(response).toEqual({
      status: HttpStatus.HTTP_STATUS_BAD_REQUEST,
      message,
      details,
      error: name,
    });
  });
});
