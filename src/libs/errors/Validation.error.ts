import { constants as HttpStatus } from 'node:http2';
import { BaseError } from './Base.error';

export class ValidationError extends BaseError {
  constructor(
    name: string,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(name, message, details, HttpStatus.HTTP_STATUS_BAD_REQUEST);
  }
}
