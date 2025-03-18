import { Types } from 'mongoose';
export type { User } from '@/entities/user';

export type TMongoObjectId = Types.ObjectId;
export const MongoObjectId = Types.ObjectId;

export interface ErrorResponse {
  status: number;
  message: string;
  details: Record<string, unknown>;
  error: string;
}

export interface IAuthJwtResponse {
  accessToken: string;
  expireInAccessToken: number;
  refreshToken: string;
  expireInRefreshToken: number;
  csrfToken: string;
}
