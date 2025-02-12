import type { MongoClient } from '@/libs/database/mongo';
import type { AuthService } from '@/modules/auth/auth.service';
import type { PetsService } from '@/modules/pets/pets.service';
import type { Config } from '@/config';
import type { App } from '../App';
import type { AuthController } from '@/modules/auth/auth.controller';
import type { PetsController } from '@/modules/pets/pets.controller';
import type { Logger } from '@/libs/Logger';

export type TMongoClient = MongoClient;
export type TAuthService = AuthService;
export type TPetsService = PetsService;
export type TConfig = Config;
export type TLogger = Logger;
export type TApp = App;
export type TAuthController = AuthController;
export type TPetsController = PetsController;
