import { MongoClient } from '../../../../src/libs/database/mongo';
import { TConfig, TLogger } from '../../../../src/types/container';
import mongoose from 'mongoose';
import fs from 'fs';

jest.mock('mongoose', () => {
  const mockDisconnect = jest.fn().mockResolvedValue(undefined);
  const mockPing = jest.fn().mockResolvedValue({ ok: 1 });
  const mockAdmin = jest.fn().mockReturnValue({ ping: mockPing });
  const mockDb = {
    admin: mockAdmin,
    dropDatabase: jest.fn().mockResolvedValue(undefined),
  };

  return {
    connect: jest.fn().mockResolvedValue({
      connection: { db: mockDb },
    }),
    disconnect: mockDisconnect,
    connection: {
      db: mockDb,
    },
    ConnectOptions: {},
  };
});

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

type MockMongoose = {
  connect: jest.Mock;
  disconnect: jest.Mock;
  connection: {
    db: {
      admin: jest.Mock;
      dropDatabase: jest.Mock;
    };
  };
};

describe('MongoClient', () => {
  let mongoClient: MongoClient;
  let mockConfig: jest.Mocked<TConfig>;
  let mockLogger: jest.Mocked<TLogger>;
  const originalNodeEnv = process.env.NODE_ENV;
  const mockMongoose = mongoose as unknown as MockMongoose;

  beforeEach(() => {
    mockConfig = {
      values: {
        MONGODB_URI: 'mongodb://localhost:27017/test',
        MONGODB_TLS_FILE_PATH: './certs/ca.key',
      },
    } as unknown as jest.Mocked<TConfig>;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<TLogger>;

    mongoClient = new MongoClient(mockConfig, mockLogger);

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('connect', () => {
    it('should connect to MongoDB successfully', async () => {
      process.env.NODE_ENV = 'production';

      await mongoClient.connect();

      expect(mockMongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/test',
        expect.objectContaining({
          maxPoolSize: 1,
          directConnection: true,
        }),
      );

      if (process.env.NODE_ENV !== 'test') {
        expect(mockMongoose.connect.mock.calls[0][1]).toHaveProperty(
          'tlsCAFile',
          './certs/ca.key',
        );
      }

      expect(mockLogger.info).toHaveBeenCalledWith(
        'MongoDB connected successfully',
      );
    });

    it('should connect without re-connecting if already connected', async () => {
      await mongoClient.connect();

      (mongoClient as any).connection = {};

      await mongoClient.connect();

      expect(mockMongoose.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle TLS config correctly in test environment', async () => {
      process.env.NODE_ENV = 'test';

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await mongoClient.connect();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'MongoDB connecting in test mode (without transactions support)',
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('TLS file not found at'),
      );
      expect(mockMongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/test',
        expect.not.objectContaining({
          tlsCAFile: './certs/ca.key',
        }),
      );
    });

    it('should handle connection errors in test environment', async () => {
      process.env.NODE_ENV = 'test';
      const error = new Error('Connection error');
      mockMongoose.connect.mockRejectedValue(error);

      await expect(mongoClient.connect()).rejects.toThrow('Connection error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'MongoDB connection error:',
        error,
      );
    });
  });

  describe('buildSessionOptions', () => {
    it('should return options with session: null in test environment', () => {
      process.env.NODE_ENV = 'test';
      const options = { someOption: 'value' };

      const result = mongoClient.buildSessionOptions(options);

      expect(result).toEqual({
        session: null,
        someOption: 'value',
      });
    });

    it('should return options as is in non-test environment', () => {
      process.env.NODE_ENV = 'production';
      const options = { someOption: 'value' };

      const result = mongoClient.buildSessionOptions(options);

      expect(result).toEqual(options);
    });
  });

  describe('dropDatabase', () => {
    it('should drop database successfully', async () => {
      await mongoClient.dropDatabase();

      expect(mockMongoose.connection.db.dropDatabase).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('MongoDB database dropped');
    });

    it('should handle errors when database connection is not established', async () => {
      const originalDb = mockMongoose.connection.db;
      mockMongoose.connection.db = null as any;

      await mongoClient.dropDatabase();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'MongoDB connection not established',
      );

      mockMongoose.connection.db = originalDb;
    });
  });

  describe('disconnect', () => {
    it('should disconnect from MongoDB successfully', async () => {
      await mongoClient.disconnect();

      expect(mockMongoose.disconnect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('MongoDB disconnected');
    });
  });

  describe('ping', () => {
    it('should return true if ping is successful', async () => {
      (mongoClient as any).connection = {};

      const result = await mongoClient.ping();

      expect(result).toBe(true);
      expect(mockMongoose.connection.db.admin).toHaveBeenCalled();
    });

    it('should return false if connection is not established', async () => {
      (mongoClient as any).connection = null;

      const result = await mongoClient.ping();

      expect(result).toBe(false);
    });

    it('should return false if ping fails', async () => {
      (mongoClient as any).connection = {};
      const error = new Error('Ping error');
      const mockPingFn = mockMongoose.connection.db.admin().ping as jest.Mock;
      mockPingFn.mockRejectedValue(error);

      const result = await mongoClient.ping();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'MongoDB ping error:',
        error,
      );
    });
  });
});
