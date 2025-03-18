import { QueueError } from '../../../../src/libs/errors/Queue.error';
import { constants as HttpStatus } from 'node:http2';

describe('QueueError', () => {
  it('should create an error with provided parameters', () => {
    const name = 'RabbitMQError';
    const message = 'Failed to connect to RabbitMQ';
    const status = HttpStatus.HTTP_STATUS_SERVICE_UNAVAILABLE;
    const details = { retryAttempts: 3, queue: 'messages' };

    const error = new QueueError(name, message, status, details);

    expect(error.name).toBe(name);
    expect(error.message).toBe(message);
    expect(error.status).toBe(status);
  });

  it('should convert to response format', () => {
    const name = 'QueueProcessingError';
    const message = 'Message processing timeout';
    const status = HttpStatus.HTTP_STATUS_GATEWAY_TIMEOUT;
    const details = { messageId: '12345', processingTime: '30s' };

    const error = new QueueError(name, message, status, details);
    const response = error.toResponse();

    expect(response).toEqual({
      status,
      message,
      details,
      error: name,
    });
  });

  it('should create an error with empty details object by default', () => {
    const name = 'QueueConnectionError';
    const message = 'Connection refused';
    const status = HttpStatus.HTTP_STATUS_BAD_GATEWAY;

    const error = new QueueError(name, message, status);
    const response = error.toResponse();

    expect(response.details).toEqual({});
  });
});
