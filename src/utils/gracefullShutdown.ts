import { TYPES } from '@/constants/types';
import type { TLogger, TMongoClient } from '@/types/container';
import type { Container } from 'inversify';

export function setupGracefulShutdown(appContainer: Container): void {
  const logger = appContainer.get<TLogger>(TYPES.Logger);

  const shutdownHandler = async (exitCode: number, message: string) => {
    logger.info(message);
    const mongoService = appContainer.get<TMongoClient>(TYPES.MongoClient);
    await mongoService.disconnect();
    process.exit(exitCode);
  };

  process.on('SIGINT', () => shutdownHandler(0, 'Process terminated by user.'));
  process.on('SIGTERM', () => shutdownHandler(0, 'Process terminated.'));
  process.on('uncaughtException', async (error) => {
    logger.error('setupGracefulShutdown uncaughtException', error);
    await shutdownHandler(1, 'Unhandled exception occurred.');
  });
  process.on('unhandledRejection', async (reason) => {
    logger.error(
      'setupGracefulShutdown Unhandled rejection',
      JSON.stringify(reason),
    );
    await shutdownHandler(1, 'Unhandled rejection occurred.');
  });
}
