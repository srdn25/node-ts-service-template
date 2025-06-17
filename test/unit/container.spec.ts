import { container } from '../../src/container';
import { TYPES } from '../../src/constants/types';

jest.mock('../../src/config', () => {
  return {
    Config: jest.fn().mockImplementation(() => ({
      values: {
        MONGODB_URI: 'mongodb://localhost:27017/test',
        MONGODB_TLS_FILE_PATH: './certs/ca.key',
        JWT_SECRET: 'test-secret',
        PORT: 3000,
        NODE_ENV: 'test',
        LOGGER_LEVEL: 'error',
        SWAGGER_PATH: '/docs',
      },
    })),
  };
});

jest.mock('../../swagger', () => ({
  specs: { swagger: '2.0' },
}));

jest.mock('../../src/libs/Logger');
jest.mock('../../src/libs/database/mongo');
jest.mock('../../src/modules/auth/service');
jest.mock('../../src/modules/auth/controller');
jest.mock('../../src/modules/health/controller');
jest.mock('../../src/App');

describe('IoC Container', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve all dependencies', () => {
    const config = container.get(TYPES.Config);
    const logger = container.get(TYPES.Logger);
    const mongoClient = container.get(TYPES.MongoClient);
    const authService = container.get(TYPES.AuthService);
    const authController = container.get(TYPES.AuthController);
    const app = container.get(TYPES.App);
    const healthController = container.get(TYPES.HealthController);

    expect(config).toBeDefined();
    expect(logger).toBeDefined();
    expect(mongoClient).toBeDefined();
    expect(authService).toBeDefined();
    expect(authController).toBeDefined();
    expect(app).toBeDefined();
    expect(healthController).toBeDefined();
  });

  it('should ensure singletons are the same instance', () => {
    const config1 = container.get(TYPES.Config);
    const config2 = container.get(TYPES.Config);
    expect(config1).toBe(config2);

    const logger1 = container.get(TYPES.Logger);
    const logger2 = container.get(TYPES.Logger);
    expect(logger1).toBe(logger2);

    const mongoClient1 = container.get(TYPES.MongoClient);
    const mongoClient2 = container.get(TYPES.MongoClient);
    expect(mongoClient1).toBe(mongoClient2);

    const app1 = container.get(TYPES.App);
    const app2 = container.get(TYPES.App);
    expect(app1).toBe(app2);
  });
});
