import { constants as HttpStatus } from 'node:http2';
import { BaseError } from './Base.error';

export class MongooseErrorHandler extends BaseError {
  constructor(error: Error, details?: Record<string, unknown>) {
    const unknownError = {
      status: HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR,
      message: 'An unknown Mongoose error occurred.',
    };

    const errorMapping = MongooseErrorMappings[error.name] || unknownError;

    super(error.name, errorMapping.message, details, errorMapping.status);
  }
}

export const MongooseErrorMappings: Record<
  string,
  { status: number; message: string }
> = {
  CastError: {
    status: HttpStatus.HTTP_STATUS_BAD_REQUEST,
    message: 'Invalid data type provided.',
  },
  ValidationError: {
    status: HttpStatus.HTTP_STATUS_UNPROCESSABLE_ENTITY,
    message: 'Validation failed for the provided data.',
  },
  DocumentNotFoundError: {
    status: HttpStatus.HTTP_STATUS_NOT_FOUND,
    message: 'Requested document was not found.',
  },
  MongooseServerSelectionError: {
    status: HttpStatus.HTTP_STATUS_SERVICE_UNAVAILABLE,
    message: 'Unable to connect to the database server.',
  },
  StrictModeError: {
    status: HttpStatus.HTTP_STATUS_BAD_REQUEST,
    message: 'Strict mode violation in Mongoose.',
  },
  VersionError: {
    status: HttpStatus.HTTP_STATUS_CONFLICT,
    message: 'Version conflict detected during update.',
  },
  MongoServerError: {
    status: HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR,
    message: 'MongoDB server error occurred.',
  },
};
