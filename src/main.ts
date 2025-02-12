import { container } from '@/container';
import type { TApp, TLogger } from '@/types/container';
import { TYPES } from './constants/types';

async function bootstrap() {
  const app = container.get<TApp>(TYPES.App);

  try {
    await app.start();
    const logger = container.get<TLogger>(TYPES.Logger);

    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.warn(`Received ${signal}, shutting down...`);
        await app.stop();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.log(error);
  console.log('Cannot start server');
});
