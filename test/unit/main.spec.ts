import { Container } from 'inversify';
import { TYPES } from '../../src/constants/types';
import * as gracefulShutdown from '../../src/utils/gracefullShutdown';

jest.resetModules();

const mockApp = {
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockContainer = {
  get: jest.fn((type) => {
    if (type === TYPES.App) return mockApp;
    if (type === TYPES.Logger) return mockLogger;
    return undefined;
  }),
};

jest.mock('../../src/container', () => ({
  container: mockContainer,
}));

const mockSetupGracefulShutdown = jest.fn();
jest.mock('../../src/utils/gracefullShutdown', () => ({
  setupGracefulShutdown: mockSetupGracefulShutdown,
}));

const bootstrap = async () => {
  const mainModule = await import('../../src/main');
  await new Promise(process.nextTick);
};

describe('Main', () => {
  let mockProcessOn: jest.SpyInstance;
  let mockProcessExit: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;
  let mockConsoleLog: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();

    mockProcessOn = jest.spyOn(process, 'on').mockImplementation(() => process);
    mockProcessExit = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

    jest.clearAllMocks();
  });

  afterEach(() => {
    mockProcessOn.mockRestore();
    mockProcessExit.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleLog.mockRestore();
  });

  it('should start the app and setup signal handlers', async () => {
    await bootstrap();

    expect(mockSetupGracefulShutdown).toHaveBeenCalledWith(mockContainer);

    expect(mockApp.start).toHaveBeenCalled();

    expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(mockProcessOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should handle errors during bootstrap', async () => {
    mockApp.start.mockRejectedValueOnce(new Error('Test error'));

    await bootstrap();

    expect(mockConsoleError).toHaveBeenCalledWith(
      'Failed to start application:',
      expect.any(Error),
    );

    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
