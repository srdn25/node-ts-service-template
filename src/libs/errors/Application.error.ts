import { constants as HttpStatus } from 'node:http2';
import { BaseError } from './Base.error';

export class ApplicationError extends BaseError {
  constructor(
    name: string,
    message: string,
    status: number = HttpStatus.HTTP_STATUS_BAD_REQUEST,
    details: Record<string, unknown> = {},
  ) {
    super(name, message, details, status);
  }
}
