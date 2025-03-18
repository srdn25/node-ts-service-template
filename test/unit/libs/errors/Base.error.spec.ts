import { BaseError } from '../../../../src/libs/errors/Base.error';

describe('BaseError', () => {
  const name = 'TestError';
  const message = 'Test message';
  const details = { code: 'TEST_ERROR' };
  const status = 400;

  it('should create an error with provided parameters', () => {
    const error = new BaseError(name, message, details, status);

    expect(error.name).toBe(name);
    expect(error.message).toBe(message);
    expect(error.status).toBe(status);
  });

  it('should convert to response format', () => {
    const error = new BaseError(name, message, details, status);
    const response = error.toResponse();

    expect(response).toEqual({
      status,
      message,
      details,
      error: name,
    });
  });
});
