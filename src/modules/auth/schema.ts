import type { TMongoObjectId } from '@/types';
import { z } from 'zod';

const headersSchema = z.object({}).passthrough();
const paramsSchema = z.object({}).passthrough();
const updateParamsSchema = z
  .object({
    userId: z.custom<TMongoObjectId>(),
  })
  .passthrough();
const querySchema = z.object({}).passthrough();

const loginBodySchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' }),
});

const registerBodySchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  mobile: z.string().optional(),
  services: z.array(z.string()).optional(),
  emailTemplate: z.string().optional(),
  name: z.string(),
  address: z.string(),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' }),
  phone: z.string().trim().min(1).optional(),
});

const updateBodySchema = z
  .object({
    mobile: z.string().optional(),
    services: z.array(z.string()).optional(),
    emailTemplate: z.string().optional(),
    name: z.string(),
    address: z.string(),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' }),
    phone: z.string().trim().min(1).optional(),
  })
  .partial();

export const loginRequestSchema = z.object({
  headers: headersSchema,
  params: paramsSchema,
  query: querySchema,
  body: loginBodySchema,
});

export const registerRequestSchema = z.object({
  headers: headersSchema,
  params: paramsSchema,
  query: querySchema,
  body: registerBodySchema,
});

export const updateRequestSchema = z.object({
  headers: headersSchema,
  params: updateParamsSchema,
  query: querySchema,
  body: updateBodySchema,
});

export const refreshAuthTokenSchema = z.object({
  headers: z.object({
    'x-csrf-token': z.string(),
  }),
  body: z.object({
    refreshToken: z.string(),
    email: z.string().email(),
  }),
});

export type LoginDto = z.infer<typeof loginBodySchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export type RegisterDto = z.infer<typeof registerBodySchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export type UpdateDto = z.infer<typeof updateBodySchema>;
export type UpdateRequest = z.infer<typeof updateRequestSchema>;

export type RefreshAuthTokenDto = z.infer<typeof refreshAuthTokenSchema>;
