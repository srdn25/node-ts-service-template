import type { Server } from 'node:http';
import express, { Express, Router } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from './constants/types';
import {
  TAuthController,
  TLogger,
  TMongoClient,
  TPetsController,
} from './types/container';
import { notFoundHandler, errorHandler } from './middlewares/errorHandle';

@injectable()
export class App {
  private readonly app: Express;
  private server?: Server;
  private readonly router: Router = Router({ mergeParams: true });

  constructor(
    @inject(TYPES.MongoClient) private mongoClient: TMongoClient,
    @inject(TYPES.AuthController) private authController: TAuthController,
    @inject(TYPES.PetsController) private petsController: TPetsController,
    @inject(TYPES.Logger) private logger: TLogger,
  ) {
    this.app = express();
  }

  private setupMiddlewares() {
    this.app.use(express.json());
  }

  private setupRoutes() {
    this.authController.setupRoutes(this.router);
    this.petsController.setupRoutes(this.router);
    this.app.use(this.router);
  }

  private setupHandlerMiddlewares() {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async start() {
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupHandlerMiddlewares();

    await this.mongoClient.connect();
    this.server = this.app.listen(3000, () =>
      this.logger.info('Server running on port 3000'),
    );
  }

  public async stop() {
    if (this.server) {
      await new Promise((resolve) => this.server!.close(resolve));
      this.logger.info('Server stopped');
    }
    await this.mongoClient.disconnect();
  }
}
