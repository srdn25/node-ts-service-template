import { Container } from 'inversify';
import { TYPES } from './constants/types';
import type {
  TMongoClient,
  TAuthService,
  TAuthController,
  TApp,
  TConfig,
  TLogger,
  THealthController,
} from './types/container';
import { MongoClient } from './libs/database/mongo';
import { AuthService } from './modules/auth/service';
import { App } from './App';
import { Config } from './config';
import { AuthController } from './modules/auth/controller';
import { Logger } from './libs/Logger';
import { HealthController } from './modules/health/controller';

const container = new Container();

container.bind<TConfig>(TYPES.Config).to(Config).inSingletonScope();
container.bind<TLogger>(TYPES.Logger).to(Logger).inSingletonScope();
container
  .bind<TMongoClient>(TYPES.MongoClient)
  .to(MongoClient)
  .inSingletonScope();
container.bind<TAuthService>(TYPES.AuthService).to(AuthService);
container.bind<TAuthController>(TYPES.AuthController).to(AuthController);
container.bind<TApp>(TYPES.App).to(App).inTransientScope();
container.bind<THealthController>(TYPES.HealthController).to(HealthController);

export { container };
