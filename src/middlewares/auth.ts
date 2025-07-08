import type { z } from 'zod';
import jwt from 'jsonwebtoken';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { UserModel, UserSchemaZod } from '@/entities/user';
import type { TMongoObjectId } from '@/types';

declare module 'fastify' {
  interface FastifyRequest {
    user?: z.infer<typeof UserSchemaZod> & { _id: TMongoObjectId };
  }
}

export const authMiddleware = async (
  req: FastifyRequest,
  reply: FastifyReply,
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    reply.status(401).send({ error: message });
  }
};
