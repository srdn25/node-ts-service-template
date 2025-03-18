import os from 'node:os';
import { Request, Response, Router } from 'express';
import { inject, injectable } from 'inversify';
import { intervalToDuration } from 'date-fns';
import { catchAsync } from '@/utils';
import { TYPES } from '@/constants/types';
import { TMongoClient, TLogger } from '@/types/container';

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health check and metrics endpoints
 */

@injectable()
export class HealthController {
  constructor(
    @inject(TYPES.MongoClient) private readonly mongoClient: TMongoClient,
    @inject(TYPES.Logger) private readonly logger: TLogger,
  ) {}

  public setupRoutes(router: Router) {
    router.get('/health', this.healthCheck.bind(this));
    router.get('/metrics', this.metrics.bind(this));
  }

  private formatUptime(uptimeInSeconds: number) {
    const start = new Date(0);
    const end = new Date(uptimeInSeconds * 1000); // Convert to milliseconds

    const duration = intervalToDuration({ start, end });

    return {
      days: duration.days ?? 0,
      hours: duration.hours ?? 0,
      minutes: duration.minutes ?? 0,
      seconds: duration.seconds ?? 0,
    };
  }

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Get system health status
   *     tags: [Health]
   *     security: []
   *     responses:
   *       200:
   *         description: System is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [up, down]
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 uptime:
   *                   type: object
   *                   properties:
   *                     days:
   *                       type: number
   *                     hours:
   *                       type: number
   *                     minutes:
   *                       type: number
   *                     seconds:
   *                       type: number
   *                 mongodb:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: string
   *                       enum: [up, down]
   *                     responseTime:
   *                       type: number
   *       503:
   *         description: System is unhealthy
   */
  @catchAsync()
  private async healthCheck(req: Request, res: Response) {
    const mongoStatus = await this.checkMongoConnection();

    const systemHealth = {
      status: mongoStatus.status === 'up' ? 'up' : 'down',
      timestamp: new Date().toISOString(),
      uptime: this.formatUptime(process.uptime()),
      mongodb: mongoStatus,
    };

    if (systemHealth.status === 'up') {
      res.status(200).json(systemHealth);
    } else {
      res.status(503).json(systemHealth);
    }
  }

  /**
   * @swagger
   * /metrics:
   *   get:
   *     summary: Get system metrics
   *     tags: [Health]
   *     security: []
   *     responses:
   *       200:
   *         description: System metrics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 memory:
   *                   type: object
   *                   properties:
   *                     rss:
   *                       type: number
   *                     heapTotal:
   *                       type: number
   *                     heapUsed:
   *                       type: number
   *                 cpu:
   *                   type: object
   *                   properties:
   *                     cpus:
   *                       type: number
   *                     loadAvg:
   *                       type: array
   *                       items:
   *                         type: number
   *                     freeMemory:
   *                       type: number
   *                     totalMemory:
   *                       type: number
   *                 mongodb:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: string
   *                       enum: [up, down]
   *                     responseTime:
   *                       type: number
   *                 process:
   *                   type: object
   *                   properties:
   *                     uptime:
   *                       type: object
   *                       properties:
   *                         days:
   *                           type: number
   *                         hours:
   *                           type: number
   *                         minutes:
   *                           type: number
   *                         seconds:
   *                           type: number
   *                     pid:
   *                       type: number
   *                     platform:
   *                       type: string
   *                     nodeVersion:
   *                       type: string
   */
  @catchAsync()
  private async metrics(req: Request, res: Response) {
    const mongoStatus = await this.checkMongoConnection();

    const memoryUsage = process.memoryUsage();
    const metrics = {
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      },
      cpu: {
        cpus: os.cpus().length,
        loadAvg: os.loadavg(),
        freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
        totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
      },
      mongodb: {
        status: mongoStatus.status,
        responseTime: mongoStatus.responseTime,
      },
      process: {
        uptime: this.formatUptime(process.uptime()),
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version,
      },
    };

    res.status(200).json(metrics);
  }

  private async checkMongoConnection(): Promise<{
    status: string;
    responseTime: number;
  }> {
    try {
      const startTime = Date.now();

      const pingResult = await this.mongoClient.ping();

      const endTime = Date.now();
      return {
        status: pingResult ? 'up' : 'down',
        responseTime: endTime - startTime,
      };
    } catch (error) {
      this.logger.error('MongoDB connection failed', error as Error);
      return { status: 'down', responseTime: 0 };
    }
  }
}
