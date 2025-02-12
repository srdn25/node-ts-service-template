import { BaseError } from './Base.error';

export class QueueError extends BaseError {
  constructor(
    name: string,
    message: string,
    status: number,
    details: Record<string, unknown> = {},
  ) {
    super(name, message, details, status);
  }
}
