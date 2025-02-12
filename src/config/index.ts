import { z } from 'zod';
import { injectable } from 'inversify';

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  MONGODB_TLS_FILE_PATH: z.string().min(1).default('./certs/ca.key'),
  RABBITMQ_URI: z.string().min(1),
  JWT_SECRET: z.string().min(8, 'Secret must be at least 8 chars'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  LOGGER_LEVEL: z.enum(['info', 'warn', 'error', 'debug']).default('error'),
  LOGGER_ES_URL: z.string().min(1).optional(),
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
