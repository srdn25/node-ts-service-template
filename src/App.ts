import type { Server } from 'node:http';
import express, { Express, Router } from 'express';
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
import swaggerUi from 'swagger-ui-express';
import { specs } from '../swagger';

@injectable()
export class App {
  public readonly app: Express;
  private server?: Server;
  private readonly router: Router = Router({ mergeParams: true });

  constructor(
    @inject(TYPES.Config) private readonly config: TConfig,
    @inject(TYPES.MongoClient) private readonly mongoClient: TMongoClient,

    @inject(TYPES.AuthController)
    private readonly authController: TAuthController,

    @inject(TYPES.HealthController)
    private readonly healthController: THealthController,

    @inject(TYPES.Logger) private readonly logger: TLogger,
  ) {
    this.app = express();
  }

  private setupMiddlewares() {
    this.app.use(express.json());
  }

  private setupRoutes() {
    this.healthController.setupRoutes(this.router);
    this.authController.setupRoutes(this.router);
    this.app.use(this.router);
  }

  private setupSwagger() {
    const swaggerPath = this.config.values.SWAGGER_PATH;
    this.logger.info(`Setting up Swagger documentation at ${swaggerPath}`);

    const options = {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'NorthStar Invoice API',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        displayRequestDuration: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    };

    this.app.get(`${swaggerPath}/swagger.json`, (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
    });

    this.app.use(swaggerPath, swaggerUi.serve);
    this.app.get(swaggerPath, swaggerUi.setup(specs, options));
  }

  private setupHandlerMiddlewares() {
    this.app.use(errorHandler(container));
    this.app.use(notFoundHandler(container));
  }

  public async start() {
    this.setupMiddlewares();
    this.setupSwagger();
    this.setupRoutes();
    this.setupHandlerMiddlewares();

    await this.mongoClient.connect();
    this.server = this.app.listen(this.config.values.PORT, () =>
      this.logger.info(`Server running on port ${this.config.values.PORT}`),
    );
  }

  public async stop() {
    if (this.server) {
      await new Promise((resolve) => this.server!.close(resolve));
      this.logger.info('Server stopped');
    }
    this.logger.info('Disconnecting from mongo');
    await this.mongoClient.disconnect();
    this.logger.info('Disconnected from mongo');
  }
}
