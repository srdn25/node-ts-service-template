/* eslint-disable @typescript-eslint/no-namespace */
import type { User } from '@/entities/user.entity';
import type { TMongoObjectId } from '@/types';

declare global {
  namespace Express {
    interface Request {
      user: User & { _id: TMongoObjectId };
    }
  }
}

export {};
