import { BaseError } from '@/libs/errors/Base.error';
import { MongooseErrorHandler } from '@/libs/errors/Database.error';
import { Error } from 'mongoose';

export function DatabaseErrorCatch<Args extends unknown[], R>(
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<(...args: Args) => Promise<R>>,
): TypedPropertyDescriptor<(...args: Args) => Promise<R>> {
  const originalMethod = descriptor.value!;

  descriptor.value = async function (...args: Args): Promise<R> {
    try {
      return await originalMethod.apply(this, args);
    } catch (error: unknown) {
      if (error instanceof BaseError) {
        throw error;
      }

      const errObj = error as { message?: string };
      const errMessage = errObj.message ?? 'unknown error';

      const message = `Error in ${target.constructor.name}.${String(propertyKey)}: ${errMessage}`;

      const errors =
        error instanceof Error.ValidationError ? error.errors : { message };

      throw new MongooseErrorHandler(error as Error, errors);
    }
  };
  return descriptor;
}
