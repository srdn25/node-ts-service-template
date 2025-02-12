import { z, ZodError } from 'zod';
import { Schema, model } from 'mongoose';
import { ValidationError } from '@/libs/errors/Validation.error';
import { MongoObjectId } from '@/types';

export const UserSchemaZod = z.object({
  _id: z.instanceof(MongoObjectId),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.enum(['user', 'admin']).default('user'),
});

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  {
    optimisticConcurrency: true,
  },
);

userSchema.pre('save', function (next) {
  try {
    UserSchemaZod.parse(this);
    next();
  } catch (error) {
    let details = {};
    let message = 'Validation error save user';

    if (error instanceof ZodError) {
      message = error.message;
      details = error.errors;
    }
    next(new ValidationError('User schema pre save', message, details));
  }
});

export type User = z.infer<typeof UserSchemaZod>;
export const UserModel = model<User>('User', userSchema);
