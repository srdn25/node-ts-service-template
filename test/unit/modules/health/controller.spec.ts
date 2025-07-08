import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { HealthController } from '../../../../src/modules/health/controller';
import { TMongoClient, TLogger } from '../../../../src/types/container';

describe('HealthController', () => {
  let healthController: HealthController;
  let mockMongoClient: jest.Mocked<TMongoClient>;
  let mockLogger: jest.Mocked<TLogger>;
  let mockRouter: jest.Mocked<FastifyInstance>;
  let mockRequest: Partial<FastifyRequest>;
  let mockResponse: Partial<FastifyReply>;

  beforeEach(() => {
    mockMongoClient = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      ping: jest.fn(),
    } as unknown as jest.Mocked<TMongoClient>;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<TLogger>;

    mockRouter = {
      get: jest.fn(),
    } as unknown as jest.Mocked<FastifyInstance>;

    mockRequest = {};

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    healthController = new HealthController(mockMongoClient, mockLogger);
  });

  describe('setupRoutes', () => {
    it('should set up health and metrics routes', () => {
      healthController.setupRoutes(mockRouter);

      expect(mockRouter.get).toHaveBeenCalledTimes(2);
      expect(mockRouter.get).toHaveBeenCalledWith(
        '/health',
        expect.any(Function),
      );
      expect(mockRouter.get).toHaveBeenCalledWith(
        '/metrics',
        expect.any(Function),
      );
    });
  });

  describe('healthCheck', () => {
    it('should return status up when mongodb is up', async () => {
      mockMongoClient.ping.mockResolvedValue(true);

      const healthCheck = (healthController as any).healthCheck.bind(
        healthController,
      );
      await healthCheck(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'up',
          timestamp: expect.any(String),
          uptime: expect.objectContaining({
            days: expect.any(Number),
            hours: expect.any(Number),
            minutes: expect.any(Number),
            seconds: expect.any(Number),
          }),
          mongodb: expect.objectContaining({
            status: 'up',
            responseTime: expect.any(Number),
          }),
        }),
      );
    });

    it('should return status down when mongodb is down', async () => {
      mockMongoClient.ping.mockResolvedValue(false);

      const healthCheck = (healthController as any).healthCheck.bind(
        healthController,
      );
      await healthCheck(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'down',
          mongodb: expect.objectContaining({
            status: 'down',
          }),
        }),
      );
    });

    it('should handle mongodb connection errors', async () => {
      const error = new Error('Connection failed');
      mockMongoClient.ping.mockRejectedValue(error);

      const healthCheck = (healthController as any).healthCheck.bind(
        healthController,
      );
      await healthCheck(mockRequest, mockResponse);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'MongoDB connection failed',
        error,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'down',
          mongodb: expect.objectContaining({
            status: 'down',
            responseTime: 0,
          }),
        }),
      );
    });
  });

  describe('metrics', () => {
    it('should return system metrics', async () => {
      mockMongoClient.ping.mockResolvedValue(true);

      const metrics = (healthController as any).metrics.bind(healthController);
      await metrics(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          memory: expect.objectContaining({
            rss: expect.any(Number),
            heapTotal: expect.any(Number),
            heapUsed: expect.any(Number),
          }),
          cpu: expect.objectContaining({
            cpus: expect.any(Number),
            loadAvg: expect.arrayContaining([expect.any(Number)]),
            freeMemory: expect.any(Number),
            totalMemory: expect.any(Number),
          }),
          mongodb: expect.objectContaining({
            status: 'up',
            responseTime: expect.any(Number),
          }),
          process: expect.objectContaining({
            uptime: expect.objectContaining({
              days: expect.any(Number),
              hours: expect.any(Number),
              minutes: expect.any(Number),
              seconds: expect.any(Number),
            }),
            pid: expect.any(Number),
            platform: expect.any(String),
            nodeVersion: expect.any(String),
          }),
        }),
      );
    });

    it('should handle mongodb connection errors in metrics', async () => {
      const error = new Error('Connection failed');
      mockMongoClient.ping.mockRejectedValue(error);

      const metrics = (healthController as any).metrics.bind(healthController);
      await metrics(mockRequest, mockResponse);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'MongoDB connection failed',
        error,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          mongodb: expect.objectContaining({
            status: 'down',
            responseTime: 0,
          }),
        }),
      );
    });
  });

  describe('formatUptime', () => {
    it('should format uptime correctly', () => {
      const oneDay = 86400; // 1 day in seconds
      const oneHour = 3600; // 1 hour in seconds
      const oneMinute = 60; // 1 minute in seconds

      // 1 day, 2 hours, 3 minutes, 4 seconds
      const uptime = oneDay + oneHour * 2 + oneMinute * 3 + 4;

      const formatUptime = (healthController as any).formatUptime.bind(
        healthController,
      );
      const result = formatUptime(uptime);

      expect(result).toEqual({
        days: 1,
        hours: 2,
        minutes: 3,
        seconds: 4,
      });
    });
  });
});
