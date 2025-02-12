import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

const headersSchema = z.object({}).passthrough();
const paramsSchema = z.object({}).passthrough();
const querySchema = z.object({}).passthrough();

const loginBodySchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' }),
});

const registerBodySchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' }),
  phone: z.string().trim().min(1).optional(),
});

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

export type LoginDto = z.infer<typeof loginBodySchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export type RegisterDto = z.infer<typeof registerBodySchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
