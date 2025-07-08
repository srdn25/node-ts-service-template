import { z } from 'zod';
import { injectable } from 'inversify';

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  MONGODB_TLS_FILE_PATH: z.string().min(1).default('./certs/ca.key'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  LOGGER_LEVEL: z.enum(['info', 'warn', 'error', 'debug']).default('debug'),
  LOGGER_ES_URL: z.string().min(1).optional(),
  LOGGER_FILE_PATH: z.string().min(1).optional(),
  SWAGGER_PATH: z.string().default('/docs'),

  JWT_SECRET: z.string().min(8, 'Secret must be at least 8 chars'),
  JWT_ACCESS_TOKEN_EXPIRE_TIME: z.coerce.number().default(2 * 1000), // in ms
  JWT_REFRESH_TOKEN_SECRET: z
    .string()
    .min(8, 'Secret must be at least 8 chars'),
  JWT_REFRESH_TOKEN_EXPIRE_TIME: z.coerce.number().default(30 * 1000), // in ms
});

export type AppConfig = z.infer<typeof envSchema>;

@injectable()
export class Config {
  public readonly values: AppConfig;

  constructor() {
    this.values = envSchema.parse(process.env);
    console.log(
      'Configuration loaded:',
      this.values.NODE_ENV !== 'production' ? this.values : '*****',
    );
  }
}
