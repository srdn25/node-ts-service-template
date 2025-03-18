import { App } from '../../src/App';
import {
  TConfig,
  TMongoClient,
  TLogger,
  TAuthController,
  THealthController,
} from '../../src/types/container';
import { Server } from 'http';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import {
  errorHandler,
  notFoundHandler,
} from '../../src/middlewares/errorHandler';
import { container } from '../../src/container';

jest.mock('express', () => {
  const mockRouter = {
    use: jest.fn(),
    get: jest.fn(),
  };

  const mockExpress: any = jest.fn(() => mockRouter);
  mockExpress.Router = jest.fn().mockReturnValue(mockRouter);
  mockExpress.json = jest.fn().mockReturnValue('jsonMiddleware');

  return mockExpress;
});

jest.mock('swagger-ui-express', () => ({
  serve: 'swaggerServe',
  setup: jest.fn().mockReturnValue('swaggerSetup'),
}));

jest.mock('../../swagger', () => ({
  specs: { swagger: '2.0' },
}));

jest.mock('../../src/middlewares/errorHandler', () => ({
  errorHandler: jest.fn().mockReturnValue('errorHandlerMiddleware'),
  notFoundHandler: jest.fn().mockReturnValue('notFoundHandlerMiddleware'),
}));

jest.mock('../../src/container', () => ({
  container: {
    get: jest.fn(),
  },
}));

describe('App', () => {
  let app: App;
  let mockConfig: jest.Mocked<TConfig>;
  let mockMongoClient: jest.Mocked<TMongoClient>;
  let mockLogger: jest.Mocked<TLogger>;
  let mockAuthController: jest.Mocked<TAuthController>;
  let mockHealthController: jest.Mocked<THealthController>;
  let mockExpressApp: any;
  let mockServer: Partial<Server>;
  let mockRouter: any;

  beforeEach(() => {
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

    app = new App(
      mockConfig,
      mockMongoClient,
      mockAuthController,
      mockHealthController,
      mockLogger,
    );

    mockServer = {
      close: jest.fn().mockImplementation((callback) => {
        if (callback) callback(null);
        return mockServer;
      }),
    };

    mockExpressApp = app.app;
    mockExpressApp.listen = jest.fn().mockReturnValue(mockServer);
    mockRouter = express.Router();

    jest.clearAllMocks();
  });

  describe('setupMiddlewares', () => {
    it('should set up express json middleware', async () => {
      await app.start();

      expect(express.json).toHaveBeenCalled();
      expect(mockExpressApp.use).toHaveBeenCalledWith('jsonMiddleware');
    });
  });

  describe('setupRoutes', () => {
    it('should set up routes for all controllers', async () => {
      await app.start();

      expect(mockHealthController.setupRoutes).toHaveBeenCalledWith(mockRouter);
      expect(mockAuthController.setupRoutes).toHaveBeenCalledWith(mockRouter);

      expect(mockExpressApp.use).toHaveBeenCalledWith(mockRouter);
    });
  });

  describe('setupSwagger', () => {
    it('should set up swagger documentation routes', async () => {
      await app.start();

      expect(mockLogger.info).toHaveBeenCalledWith(
        `Setting up Swagger documentation at /docs`,
      );

      expect(mockExpressApp.get).toHaveBeenCalledWith(
        '/docs/swagger.json',
        expect.any(Function),
      );

      expect(mockExpressApp.use).toHaveBeenCalledWith('/docs', 'swaggerServe');
      expect(swaggerUi.setup).toHaveBeenCalledWith(
        { swagger: '2.0' },
        expect.objectContaining({
          explorer: true,
          customSiteTitle: 'NorthStar Invoice API',
        }),
      );
      expect(mockExpressApp.get).toHaveBeenCalledWith('/docs', 'swaggerSetup');
    });

    it('should handle swagger.json request correctly', async () => {
      await app.start();

      const calls = mockExpressApp.get.mock.calls;
      const swaggerJsonRouteCall = calls.find(
        (call: Array<any>) => call[0] === '/docs/swagger.json',
      );
      const swaggerJsonHandler = swaggerJsonRouteCall
        ? swaggerJsonRouteCall[1]
        : null;

      expect(swaggerJsonHandler).toBeDefined();

      if (swaggerJsonHandler) {
        const mockReq = {};
        const mockRes = {
          setHeader: jest.fn(),
          send: jest.fn(),
        };

        swaggerJsonHandler(mockReq, mockRes);

        expect(mockRes.setHeader).toHaveBeenCalledWith(
          'Content-Type',
          'application/json',
        );
        expect(mockRes.send).toHaveBeenCalledWith({ swagger: '2.0' });
      }
    });
  });

  describe('setupHandlerMiddlewares', () => {
    it('should set up error handler and not found handler middlewares', async () => {
      await app.start();

      expect(errorHandler).toHaveBeenCalledWith(container);
      expect(notFoundHandler).toHaveBeenCalledWith(container);

      expect(mockExpressApp.use).toHaveBeenCalledWith('errorHandlerMiddleware');
      expect(mockExpressApp.use).toHaveBeenCalledWith(
        'notFoundHandlerMiddleware',
      );
    });
  });

  describe('start', () => {
    it('should setup middlewares, swagger, routes, error handlers and start the server', async () => {
      await app.start();

      const useCalls = mockExpressApp.use.mock.calls;

      expect(useCalls[0][0]).toBe('jsonMiddleware');

      expect(mockMongoClient.connect).toHaveBeenCalled();

      expect(mockExpressApp.listen).toHaveBeenCalledWith(
        3000,
        expect.any(Function),
      );

      const listenCallback = mockExpressApp.listen.mock.calls[0][1];
      listenCallback();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Server running on port 3000',
      );
    });
  });

  describe('stop', () => {
    it('should stop the server and disconnect from MongoDB', async () => {
      await app.start();

      await app.stop();

      expect(mockServer.close).toHaveBeenCalled();

      expect(mockMongoClient.disconnect).toHaveBeenCalled();

      expect(mockLogger.info).toHaveBeenCalledWith('Server stopped');
      expect(mockLogger.info).toHaveBeenCalledWith('Disconnecting from mongo');
      expect(mockLogger.info).toHaveBeenCalledWith('Disconnected from mongo');
    });

    it('should handle case when server is not running', async () => {
      await app.stop();

      expect(mockServer.close).not.toHaveBeenCalled();

      expect(mockMongoClient.disconnect).toHaveBeenCalled();
    });
  });
});
