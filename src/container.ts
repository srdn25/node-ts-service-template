import { Container } from 'inversify';
import { TYPES } from './constants/types';
import type {
  TMongoClient,
  TAuthService,
  TAuthController,
  TApp,
  TConfig,
  TLogger,
} from './types/container';
import { MongoClient } from './libs/database/mongo';
import { AuthService } from './modules/auth/auth.service';
import { App } from './App';
import { Config } from './config';
import { AuthController } from './modules/auth/auth.controller';
import { Logger } from './libs/Logger';

const container = new Container();

container.bind<TConfig>(TYPES.Config).to(Config).inSingletonScope();
container.bind<TLogger>(TYPES.Logger).to(Logger).inSingletonScope();
container
  .bind<TMongoClient>(TYPES.MongoClient)
  .to(MongoClient)
  .inSingletonScope();
container.bind<TAuthService>(TYPES.AuthService).to(AuthService);
container.bind<TAuthController>(TYPES.AuthController).to(AuthController);
container.bind<TApp>(TYPES.App).to(App).inSingletonScope();

export { container };
