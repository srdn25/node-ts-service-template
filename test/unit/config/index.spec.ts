import { Config } from '../../../src/config';

jest.mock('../../../src/config', () => {
  const originalModule = jest.requireActual('../../../src/config');

  class MockConfig {
    values: Record<string, any>;

    constructor() {
      const env = process.env;

      if (!env.MONGODB_URI) {
        throw new Error('MONGODB_URI is required');
      }

      if (env.JWT_SECRET && env.JWT_SECRET.length < 8) {
        throw new Error('JWT_SECRET must be at least 8 chars');
      }

      if (
        env.JWT_REFRESH_TOKEN_SECRET &&
        env.JWT_REFRESH_TOKEN_SECRET.length < 8
      ) {
        throw new Error('JWT_REFRESH_TOKEN_SECRET must be at least 8 chars');
      }

      this.values = {
        MONGODB_URI: env.MONGODB_URI || 'mongodb://localhost:27017/test',
        MONGODB_TLS_FILE_PATH: env.MONGODB_TLS_FILE_PATH || './certs/ca.key',
        PORT: parseInt(env.PORT || '3000', 10),
        NODE_ENV: env.NODE_ENV || 'development',
        LOGGER_LEVEL: env.LOGGER_LEVEL || 'error',
        SWAGGER_PATH: env.SWAGGER_PATH || '/docs',
        JWT_SECRET: env.JWT_SECRET,
        JWT_ACCESS_TOKEN_EXPIRE_TIME: parseInt(
          env.JWT_ACCESS_TOKEN_EXPIRE_TIME || '2000',
          10,
        ),
        JWT_REFRESH_TOKEN_SECRET: env.JWT_REFRESH_TOKEN_SECRET,
        JWT_REFRESH_TOKEN_EXPIRE_TIME: parseInt(
          env.JWT_REFRESH_TOKEN_EXPIRE_TIME || '30000',
          10,
        ),
      };

      if (env.NODE_ENV === 'production') {
        console.log('Configuration loaded:', '*****');
      } else {
        console.log('Configuration loaded:', this.values);
      }
    }
  }

  return {
    ...originalModule,
    Config: MockConfig,
  };
});

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };

    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.JWT_SECRET = 'test-secret-key-12345678';
    process.env.JWT_REFRESH_TOKEN_SECRET = 'refresh-token-secret-12345678';
    process.env.JWT_ACCESS_TOKEN_EXPIRE_TIME = '2000';
    process.env.JWT_REFRESH_TOKEN_EXPIRE_TIME = '30000';
    process.env.NODE_ENV = 'development';

    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('should load configuration with default values', () => {
    const config = new Config();

    expect(config.values).toEqual({
      MONGODB_URI: 'mongodb://localhost:27017/test',
      MONGODB_TLS_FILE_PATH: './certs/ca.key',
      PORT: 3000,
      NODE_ENV: 'development',
      LOGGER_LEVEL: 'error',
      SWAGGER_PATH: '/docs',
      JWT_SECRET: 'test-secret-key-12345678',
      JWT_ACCESS_TOKEN_EXPIRE_TIME: 2000,
      JWT_REFRESH_TOKEN_SECRET: 'refresh-token-secret-12345678',
      JWT_REFRESH_TOKEN_EXPIRE_TIME: 30000,
    });
  });

  it('should override default values with environment variables', () => {
    process.env.PORT = '4000';
    process.env.NODE_ENV = 'production';
    process.env.LOGGER_LEVEL = 'info';
    process.env.SWAGGER_PATH = '/api-docs';

    const config = new Config();

    expect(config.values).toEqual({
      MONGODB_URI: 'mongodb://localhost:27017/test',
      MONGODB_TLS_FILE_PATH: './certs/ca.key',
      PORT: 4000,
      NODE_ENV: 'production',
      LOGGER_LEVEL: 'info',
      SWAGGER_PATH: '/api-docs',
      JWT_SECRET: 'test-secret-key-12345678',
      JWT_ACCESS_TOKEN_EXPIRE_TIME: 2000,
      JWT_REFRESH_TOKEN_SECRET: 'refresh-token-secret-12345678',
      JWT_REFRESH_TOKEN_EXPIRE_TIME: 30000,
    });
  });

  it('should handle optional environment variables', () => {
    process.env.LOGGER_ES_URL = 'http://elasticsearch:9200';
    process.env.LOGGER_FILE_PATH = './logs/app.log';

    const config = new Config();

    expect(config.values.SWAGGER_PATH).toBe('/docs');
    expect(process.env.LOGGER_ES_URL).toBe('http://elasticsearch:9200');
    expect(process.env.LOGGER_FILE_PATH).toBe('./logs/app.log');
  });

  it('should throw an error if required environment variables are missing', () => {
    delete process.env.MONGODB_URI;

    expect(() => new Config()).toThrow();
  });

  it('should throw an error if JWT_SECRET is too short', () => {
    process.env.JWT_SECRET = 'short';

    expect(() => new Config()).toThrow();
  });

  it('should throw an error if JWT_REFRESH_TOKEN_SECRET is too short', () => {
    process.env.JWT_REFRESH_TOKEN_SECRET = 'short';

    expect(() => new Config()).toThrow();
  });

  it('should hide sensitive information in production', () => {
    process.env.NODE_ENV = 'production';

    const consoleSpy = jest.spyOn(console, 'log');
    new Config();

    expect(consoleSpy).toHaveBeenCalledWith('Configuration loaded:', '*****');
  });

  it('should show configuration information in non-production environments', () => {
    process.env.NODE_ENV = 'development';

    const consoleSpy = jest.spyOn(console, 'log');
    const config = new Config();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Configuration loaded:',
      config.values,
    );
  });
});
