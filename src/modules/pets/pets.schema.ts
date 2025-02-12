import { z } from 'zod';

const paramsSchema = z.object({
  petId: z.string().min(1, { message: 'petId is required in params' }),
});

const querySchema = z.object({}).passthrough();
const headersSchema = z.object({}).passthrough();

const createPetBodySchema = z.object({
  name: z.string().min(2),
  dateOfBirth: z.coerce.date(),
  about: z.string().optional(),
  type: z.enum(['cat', 'dog', 'other'], {
    errorMap: () => ({
      message: 'Type must be one of cat, dog or other',
    }),
  }),
});

const uploadFileBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Name must be at least 2 characters' }),
  description: z
    .string()
    .trim()
    .min(5, { message: 'Description must be at least 5 characters' }),
  type: z.enum(['photo', 'profilePicture', 'document', 'other'], {
    errorMap: () => ({
      message: 'Type must be one of photo, profilePicture, document, or other',
    }),
  }),
});

export const uploadPetFileRequestSchema = z.object({
  headers: headersSchema,
  params: paramsSchema,
  query: querySchema,
  body: uploadFileBodySchema,
});

export const createPetRequestSchema = z.object({
  headers: headersSchema,
  body: createPetBodySchema,
});

export type CreatePetDto = z.infer<typeof createPetBodySchema>;
export type CreatePetRequest = z.infer<typeof createPetRequestSchema>;

export type UploadPetFileDto = z.infer<typeof uploadFileBodySchema>;
export type UploadPetFileRequest = z.infer<typeof uploadPetFileRequestSchema>;
