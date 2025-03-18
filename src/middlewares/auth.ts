import type { z } from 'zod';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { UserModel, UserSchemaZod } from '@/entities/user';
import type { TMongoObjectId } from '@/types';

export const authMiddleware = async <
  TParams = unknown,
  TQuery = unknown,
  TBody = unknown,
>(
  req: Request<TParams, unknown, TBody, TQuery>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: TMongoObjectId;
      email: string;
    };
    const user = await UserModel.findOne({
      email: decoded.email,
      _id: decoded.userId,
    });

    if (!user) {
      throw new Error('User not found');
    }

    req.user = UserSchemaZod.parse(user.toObject()) as z.infer<
      typeof UserSchemaZod
    > & { _id: TMongoObjectId };
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    res.status(401).json({ error: message });
  }
};
