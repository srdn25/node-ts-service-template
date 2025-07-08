import path from 'node:path';
import { FastifyInstance, fastify } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { inject, injectable } from 'inversify';
import { TYPES } from './constants/types';
import {
  TAuthController,
  TConfig,
  THealthController,
  TLogger,
  TMongoClient,
} from './types/container';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler';
import { container } from './container';
import { specs } from '../swagger';

@injectable()
export class App {
  public readonly app: FastifyInstance;

  constructor(
    @inject(TYPES.Config) private readonly config: TConfig,
    @inject(TYPES.MongoClient) private readonly mongoClient: TMongoClient,

    @inject(TYPES.AuthController)
    private readonly authController: TAuthController,

    @inject(TYPES.HealthController)
    private readonly healthController: THealthController,

    @inject(TYPES.Logger) private readonly logger: TLogger,
  ) {
    this.app = fastify();
  }

  private setupMiddlewares() {
    // Fastify has its own JSON body parser
  }

  private setupRoutes() {
    this.healthController.setupRoutes(this.app);
    this.authController.setupRoutes(this.app);
  }

  private async setupSwagger() {
    const swaggerPath = this.config.values.SWAGGER_PATH;
    this.logger.info(`Setting up Swagger documentation at ${swaggerPath}`);

    await this.app.register(swagger, {
      swagger: specs,
    });

    await this.app.register(swaggerUi, {
      routePrefix: swaggerPath,
      baseDir: process.env.NODE_ENV === 'production'
        ? path.join(__dirname, 'static', 'swagger-ui')
        : undefined,
      uiConfig: {
        docExpansion: 'list',
        filter: true,
        displayRequestDuration: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha'
      },
      staticCSP: true,
      theme: {
        title: 'Service Template API',
      },
    });
  }

  private setupHandlerMiddlewares() {
    this.app.setErrorHandler(errorHandler(container));
    this.app.setNotFoundHandler(notFoundHandler(container));
  }

  public async start() {
    this.setupMiddlewares();
    await this.setupSwagger();
    this.setupRoutes();
    this.setupHandlerMiddlewares();

    await this.mongoClient.connect();
    // Added 0.0.0.0 to listen on all interfaces. It is needed for load tests to work
    await this.app.listen({ port: this.config.values.PORT, host: '0.0.0.0' });
    this.logger.info(`Server running on port ${this.config.values.PORT}`);
  }

  public async stop() {
    if (this.app) {
      await this.app.close();
      this.logger.info('Server stopped');
    }
    this.logger.info('Disconnecting from mongo');
    await this.mongoClient.disconnect();
    this.logger.info('Disconnected from mongo');
  }
}
