import { inject } from 'inversify';
import mongoose from 'mongoose';
import { TYPES } from '@/constants/types';
import { TConfig, TLogger } from '@/types/container';

export class MongoClient {
  constructor(
    @inject(TYPES.Config) private readonly config: TConfig,
    @inject(TYPES.Logger) private readonly logger: TLogger,
  ) {}

  public async connect() {
    try {
      await mongoose.connect(this.config.values.MONGODB_URI, {
        maxPoolSize: 10,
        tlsCAFile: this.config.values.MONGODB_TLS_FILE_PATH,
      });
      this.logger.info('MongoDB connected');
    } catch (error) {
      this.logger.error('MongoDB connection error:', error as Error);
      process.exit(1);
    }
  }

  public async disconnect() {
    await mongoose.disconnect();
    this.logger.info('MongoDB disconnected');
  }
}
