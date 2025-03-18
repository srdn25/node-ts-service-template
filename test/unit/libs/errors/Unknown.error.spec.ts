import { UnknownError } from '../../../../src/libs/errors/Unknown.error';
import { constants as HttpStatus } from 'node:http2';

describe('UnknownError', () => {
  it('should create an error with internal server error status', () => {
    const name = 'SystemError';
    const message = 'Unexpected system failure';

    const error = new UnknownError(name, message);

    expect(error.name).toBe(name);
    expect(error.message).toBe(message);
    expect(error.status).toBe(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR);
  });

  it('should convert to response format', () => {
    const name = 'UnexpectedError';
    const message = 'Something went wrong';
    const details = { context: 'initialization', component: 'core' };

    const error = new UnknownError(name, message, details);
    const response = error.toResponse();

    expect(response).toEqual({
      status: HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR,
      message,
      details,
      error: name,
    });
  });

  it('should create an error with empty details object by default', () => {
    const name = 'UnhandledError';
    const message = 'Unhandled promise rejection';

    const error = new UnknownError(name, message);
    const response = error.toResponse();

    expect(response.details).toEqual({});
  });
});
