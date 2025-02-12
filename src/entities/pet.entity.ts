import { z, ZodError } from 'zod';
import { MongoObjectId } from '@/types';
import { Schema, model } from 'mongoose';
import { ValidationError } from '@/libs/errors/Validation.error';

export const PetSchemaZod = z.object({
  name: z.string().min(2),
  type: z.enum(['cat', 'dog', 'other']),
  dateOfBirth: z.coerce.date(),
  dateOfDeath: z.coerce.date().optional(),
  about: z.string().optional(),
  ownerId: z.instanceof(MongoObjectId),
});

const petSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['cat', 'dog', 'other'], required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    points: { type: Number, default: 0 },
    dateOfBirth: { type: Date, required: true },
    dateOfDeath: { type: Date, required: false },
    about: { type: String, required: false },
  },
  {
    optimisticConcurrency: true,
  },
);

petSchema.pre('save', function (next) {
  try {
    PetSchemaZod.parse(this);
    next();
  } catch (error) {
    let details = {};
    let message = 'Validation error save pet';

    if (error instanceof ZodError) {
      message = error.message;
      details = error.errors;
    }
    next(new ValidationError('Pet schema pre save', message, details));
  }
});

export type Pet = z.infer<typeof PetSchemaZod>;
export const PetModel = model<Pet>('Pet', petSchema);
