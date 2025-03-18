import { Logger } from '../../../src/libs/Logger';
import { Config } from '../../../src/config';
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

jest.mock('winston', () => {
  const mockFormat = {
    json: jest.fn().mockReturnThis(),
    errors: jest.fn().mockReturnThis(),
    timestamp: jest.fn().mockReturnThis(),
    combine: jest.fn().mockReturnThis(),
  };

  const mockConsoleTransport = jest.fn();
  const mockFileTransport = jest.fn();
  const mockCreateLogger = jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  });

  return {
    format: mockFormat,
    transports: {
      Console: mockConsoleTransport,
      File: mockFileTransport,
    },
    createLogger: mockCreateLogger,
  };
});

jest.mock('winston-elasticsearch', () => {
  return {
    ElasticsearchTransport: jest.fn(),
  };
});

const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('Logger', () => {
  let logger: Logger;
  let mockConfig: jest.Mocked<Config>;
  const originalCwd = process.cwd;

  beforeEach(() => {
    process.cwd = jest.fn().mockReturnValue('/app');

    mockConfig = {
      values: {
        LOGGER_LEVEL: 'info',
      },
    } as unknown as jest.Mocked<Config>;

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.cwd = originalCwd;
  });

  describe('constructor', () => {
    it('should create logger with console transport only', () => {
      logger = new Logger(mockConfig);

      expect(winston.transports.Console).toHaveBeenCalled();
      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          transports: expect.any(Array),
        }),
      );
      expect(ElasticsearchTransport).not.toHaveBeenCalled();
      expect(winston.transports.File).not.toHaveBeenCalled();
    });

    it('should add Elasticsearch transport if URL is provided', () => {
      mockConfig.values.LOGGER_ES_URL = 'http://elasticsearch:9200';

      logger = new Logger(mockConfig);

      expect(ElasticsearchTransport).toHaveBeenCalledWith({
        level: 'info',
        clientOpts: { node: 'http://elasticsearch:9200' },
      });
      expect(console.log).toHaveBeenCalledWith(
        'Connect logger transport to Kibana: http://elasticsearch:9200',
      );
    });
  });

  describe('logging methods', () => {
    beforeEach(() => {
      logger = new Logger(mockConfig);
      (logger as any).logger = {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
      };
    });

    it('should call info with correct parameters', () => {
      logger.info('Test info message', { data: 'test' });

      expect((logger as any).logger.info).toHaveBeenCalledWith(
        'Test info message',
        '{"data":"test"}',
      );
    });

    it('should call error with correct parameters', () => {
      logger.error('Test error message', new Error('Test error'));

      expect((logger as any).logger.error).toHaveBeenCalledWith(
        'Test error message',
        'Test error',
      );
    });

    it('should call debug with correct parameters', () => {
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn().mockReturnValue('"timestamp"');

      try {
        logger.debug('Test debug message');

        expect((logger as any).logger.debug).toHaveBeenCalledWith(
          'Test debug message',
          '"timestamp"',
        );
      } finally {
        JSON.stringify = originalStringify;
      }
    });

    it('should call warn with correct parameters', () => {
      logger.warn('Test warn message', 'Warning details');

      expect((logger as any).logger.warn).toHaveBeenCalledWith(
        'Test warn message',
        '"Warning details"',
      );
    });
  });
});
