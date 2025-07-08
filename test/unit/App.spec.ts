import { App } from '../../src/App';
import {
  TConfig,
  TMongoClient,
  TLogger,
  TAuthController,
  THealthController,
} from '../../src/types/container';
import { fastify, FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  errorHandler,
  notFoundHandler,
} from '../../src/middlewares/errorHandler';
import { container } from '../../src/container';

jest.mock('fastify', () => ({
  __esModule: true,
  fastify: jest.fn(),
}));

jest.mock('@fastify/swagger-ui', () => jest.fn());

jest.mock('../../swagger', () => ({
  specs: { swagger: '2.0' },
}));

jest.mock('../../src/middlewares/errorHandler', () => ({
  errorHandler: jest.fn(() => (err: any, req: any, reply: any) => {}),
  notFoundHandler: jest.fn(() => (req: any, reply: any) => {}),
}));

jest.mock('../../src/container', () => ({
  container: {
    get: jest.fn((type) => {
      if (type === 'Logger') {
        return {
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
        };
      }
      return {};
    }),
  },
}));

describe('App', () => {
  let app: App;
  let mockConfig: jest.Mocked<TConfig>;
  let mockMongoClient: jest.Mocked<TMongoClient>;
  let mockLogger: jest.Mocked<TLogger>;
  let mockAuthController: jest.Mocked<TAuthController>;
  let mockHealthController: jest.Mocked<THealthController>;
  
  let mockFastifyApp: jest.Mocked<FastifyInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = {
      values: {
        PORT: 3000,
        SWAGGER_PATH: '/docs',
      },
    } as unknown as jest.Mocked<TConfig>;

    mockMongoClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<TMongoClient>;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<TLogger>;

    mockAuthController = {
      setupRoutes: jest.fn(),
    } as unknown as jest.Mocked<TAuthController>;

    mockHealthController = {
      setupRoutes: jest.fn(),
    } as unknown as jest.Mocked<THealthController>;

    mockFastifyApp = {
      register: jest.fn().mockReturnThis(),
      setErrorHandler: jest.fn().mockReturnThis(),
      setNotFoundHandler: jest.fn().mockReturnThis(),
      listen: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<FastifyInstance>;

    // Mock the fastify function itself to return our mockFastifyApp
    (fastify as unknown as jest.Mock).mockImplementation(() => mockFastifyApp);

    app = new App(
      mockConfig,
      mockMongoClient,
      mockAuthController,
      mockHealthController,
      mockLogger,
    );
  });

  describe('setupMiddlewares', () => {
    it('should not set up any specific middlewares as Fastify has its own JSON body parser', async () => {
      await app.start();

      expect(mockFastifyApp.register).not.toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('setupRoutes', () => {
    it('should set up routes for all controllers', async () => {
      await app.start();

      expect(mockHealthController.setupRoutes).toHaveBeenCalledWith(mockFastifyApp);
      expect(mockAuthController.setupRoutes).toHaveBeenCalledWith(mockFastifyApp);
    });
  });

  describe('setupSwagger', () => {
    it('should set up swagger documentation routes', async () => {
      await app.start();

      expect(mockLogger.info).toHaveBeenCalledWith(
        `Setting up Swagger documentation at /docs`,
      );

      expect(mockFastifyApp.register).toHaveBeenCalledWith(swagger, {
        swagger: { swagger: '2.0' },
      });

      expect(mockFastifyApp.register).toHaveBeenCalledWith(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: expect.objectContaining({
          docExpansion: 'list',
          filter: true,
          displayRequestDuration: true,
          tagsSorter: 'alpha',
          operationsSorter: 'alpha',
        }),
        staticCSP: true,
        theme: {
          title: 'Service Template API',
        },
      });
    });
  });

  describe('setupHandlerMiddlewares', () => {
    it('should set up error handler and not found handler middlewares', async () => {
      await app.start();

      expect(mockFastifyApp.setErrorHandler).toHaveBeenCalledWith(expect.any(Function));
      expect(mockFastifyApp.setNotFoundHandler).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('start', () => {
    it('should setup middlewares, swagger, routes, error handlers and start the server', async () => {
      await app.start();

      expect(mockMongoClient.connect).toHaveBeenCalled();

      expect(mockFastifyApp.listen).toHaveBeenCalledWith({
        port: 3000,
        host: '0.0.0.0',
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Server running on port 3000',
      );
    });
  });

  describe('stop', () => {
    it('should stop the server and disconnect from MongoDB', async () => {
      await app.start();

      await app.stop();

      expect(mockFastifyApp.close).toHaveBeenCalled();

      expect(mockMongoClient.disconnect).toHaveBeenCalled();

      expect(mockLogger.info).toHaveBeenCalledWith('Server stopped');
      expect(mockLogger.info).toHaveBeenCalledWith('Disconnecting from mongo');
      expect(mockLogger.info).toHaveBeenCalledWith('Disconnected from mongo');
    });

    it('should handle case when server is not running', async () => {
      (app as any).app = null;
      await app.stop();
      expect(mockFastifyApp.close).not.toHaveBeenCalled();
      expect(mockMongoClient.disconnect).toHaveBeenCalled();
    });
  });
});
