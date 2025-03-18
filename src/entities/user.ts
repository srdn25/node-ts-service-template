import { z, ZodError } from 'zod';
import { Schema, model } from 'mongoose';
import { ValidationError } from '@/libs/errors/Validation.error';
import { MongoObjectId } from '@/types';

export const UserSchemaZod = z.object({
  _id: z.instanceof(MongoObjectId),
  name: z.string(),
  email: z.string().email(),
  address: z.string(),
  password: z.string().min(8),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  services: z.array(z.string()).optional(),
  emailTemplate: z.string().optional(),
});

// exported only for testing purposes
export const userSchema = new Schema(
  {
    name: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    phone: { type: String },
    mobile: { type: String },
    services: [{ type: String, uniqueItems: true }],
    emailTemplate: { type: String },
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
    let message = 'Validation error on saving user';
    if (error instanceof ZodError) {
      message = error.message;
      details = error.errors;
    }
    next(new ValidationError('User schema pre save', message, details));
  }
});

export type User = z.infer<typeof UserSchemaZod>;
export const UserModel = model<User>('User', userSchema);
