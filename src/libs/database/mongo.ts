import { inject } from 'inversify';
import mongoose, { type Mongoose } from 'mongoose';
import { TYPES } from '@/constants/types';
import { TConfig, TLogger } from '@/types/container';
import fs from 'fs';
import path from 'path';

export class MongoClient {
  public connection: Mongoose | null;

  constructor(
    @inject(TYPES.Config) private readonly config: TConfig,
    @inject(TYPES.Logger) private readonly logger: TLogger,
  ) {
    this.connection = null;
  }

  public async connect() {
    try {
      if (this.connection) {
        return this.connection;
      }

      const connectionOptions: mongoose.ConnectOptions = {
        maxPoolSize: 1,
        directConnection: true,
      };

      if (process.env.NODE_ENV === 'test') {
        this.logger.info(
          'MongoDB connecting in test mode (without transactions support)',
        );

        const tlsFilePath = this.config.values.MONGODB_TLS_FILE_PATH;
        if (tlsFilePath && fs.existsSync(path.resolve(tlsFilePath))) {
          connectionOptions.tlsCAFile = tlsFilePath;
        } else {
          this.logger.info(
            `TLS file not found at ${tlsFilePath}, connecting without TLS`,
          );
        }
      } else {
        connectionOptions.tlsCAFile = this.config.values.MONGODB_TLS_FILE_PATH;
      }

      this.connection = await mongoose.connect(
        this.config.values.MONGODB_URI,
        connectionOptions,
      );
      this.logger.info('MongoDB connected successfully');
    } catch (error) {
      this.logger.error('MongoDB connection error:', error as Error);

      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      } else {
        throw error;
      }
    }
  }

  public buildSessionOptions(options?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'test') {
      return { session: null, ...options };
    }
    return options;
  }

  public async dropDatabase() {
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.dropDatabase();
        this.logger.info('MongoDB database dropped');
      } else {
        this.logger.error('MongoDB connection not established');
      }
    } catch (error) {
      this.logger.error('MongoDB database drop error:', error as Error);
      process.exit(1);
    }
  }

  public async disconnect() {
    await mongoose.disconnect();
    this.logger.info('MongoDB disconnected');
  }

  public async ping(): Promise<boolean> {
    try {
      if (!this.connection || !mongoose.connection.db) {
        return false;
      }

      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      this.logger.error('MongoDB ping error:', error as Error);
      return false;
    }
  }
}
