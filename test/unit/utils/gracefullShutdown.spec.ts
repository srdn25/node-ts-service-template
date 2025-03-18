import { Container } from 'inversify';
import { setupGracefulShutdown } from '../../../src/utils/gracefullShutdown';
import { TYPES } from '../../../src/constants/types';
import { TLogger, TMongoClient } from '../../../src/types/container';

beforeAll(() => {
  jest.useFakeTimers();
  jest.clearAllTimers();
  process.removeAllListeners();
});

afterAll(() => {
  jest.resetModules();
  jest.restoreAllMocks();
  jest.clearAllTimers();
  jest.useRealTimers();
  process.removeAllListeners();
});

describe('gracefulShutdown', () => {
  let mockContainer: Container;
  let mockLogger: Partial<TLogger>;
  let mockMongoClient: jest.Mocked<TMongoClient>;
  let mockProcessOn: jest.SpyInstance;
  let mockProcessExit: jest.SpyInstance;
  let handlers: Map<string, Function> = new Map();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    process.removeAllListeners();
    handlers.clear();

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    mockMongoClient = {
      disconnect: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn(),
    } as unknown as jest.Mocked<TMongoClient>;

    mockContainer = {
      get: jest.fn((type) => {
        if (type === TYPES.Logger) return mockLogger;
        if (type === TYPES.MongoClient) return mockMongoClient;
        return undefined;
      }),
    } as unknown as Container;

    mockProcessOn = jest
      .spyOn(process, 'on')
      .mockImplementation((event, listener) => {
        handlers.set(event as string, listener as Function);
        return process;
      });

    mockProcessExit = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    mockProcessOn.mockRestore();
    mockProcessExit.mockRestore();
    process.removeAllListeners();
    jest.clearAllTimers();

    const activeTimeouts = jest.getTimerCount();
    if (activeTimeouts > 0) {
      jest.clearAllTimers();
    }
  });

  it('should setup event handlers for graceful shutdown', () => {
    setupGracefulShutdown(mockContainer);

    expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(mockProcessOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(mockProcessOn).toHaveBeenCalledWith(
      'uncaughtException',
      expect.any(Function),
    );
    expect(mockProcessOn).toHaveBeenCalledWith(
      'unhandledRejection',
      expect.any(Function),
    );
  });

  it('should handle SIGINT signal', async () => {
    setupGracefulShutdown(mockContainer);

    const sigintHandler = handlers.get('SIGINT');
    expect(sigintHandler).toBeDefined();

    await sigintHandler!();

    expect(mockLogger.info).toHaveBeenCalledWith('Process terminated by user.');
    expect(mockMongoClient.disconnect).toHaveBeenCalled();
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });

  it('should handle SIGTERM signal', async () => {
    setupGracefulShutdown(mockContainer);

    const sigtermHandler = handlers.get('SIGTERM');
    expect(sigtermHandler).toBeDefined();

    await sigtermHandler!();

    expect(mockLogger.info).toHaveBeenCalledWith('Process terminated.');
    expect(mockMongoClient.disconnect).toHaveBeenCalled();
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });

  it('should handle uncaughtException', async () => {
    setupGracefulShutdown(mockContainer);

    const uncaughtHandler = handlers.get('uncaughtException');
    expect(uncaughtHandler).toBeDefined();

    const testError = new Error('Test error');

    await uncaughtHandler!(testError);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'setupGracefulShutdown uncaughtException',
      testError,
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Unhandled exception occurred.',
    );
    expect(mockMongoClient.disconnect).toHaveBeenCalled();
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('should handle unhandledRejection', async () => {
    setupGracefulShutdown(mockContainer);

    const unhandledHandler = handlers.get('unhandledRejection');
    expect(unhandledHandler).toBeDefined();

    const testReason = { message: 'Test reason' };

    await unhandledHandler!(testReason);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'setupGracefulShutdown Unhandled rejection',
      JSON.stringify(testReason),
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Unhandled rejection occurred.',
    );
    expect(mockMongoClient.disconnect).toHaveBeenCalled();
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
