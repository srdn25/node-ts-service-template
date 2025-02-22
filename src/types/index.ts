import { Types } from 'mongoose';
export type { User } from '@/entities/user.entity';

export type TMongoObjectId = Types.ObjectId;
export const MongoObjectId = Types.ObjectId;

export interface ErrorResponse {
  status: number;
  message: string;
  details: Record<string, unknown>;
  error: string;
}
