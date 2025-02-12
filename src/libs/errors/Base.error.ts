import type { ErrorResponse } from '@/types';

export class BaseError extends Error {
  public status: number;
  private details: Record<string, unknown>;

  constructor(
    name: string,
    message: string,
    details: Record<string, unknown> = {},
    status: number,
  ) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = name;
  }

  public toResponse(): ErrorResponse {
    return {
      status: this.status,
      message: this.message,
      details: this.details,
      error: this.name,
    };
  }
}
