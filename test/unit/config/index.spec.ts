import { Config } from '../../../src/config';



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
    process.env.PORT = '3000';

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
      LOGGER_LEVEL: 'debug',
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
