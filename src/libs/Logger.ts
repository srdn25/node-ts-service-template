import winston from 'winston';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/constants/types';
import { TConfig } from '@/types/container';
import { ElasticsearchTransport } from 'winston-elasticsearch';

type TLoggerMetaData = Record<string, unknown> | string | Error;

@injectable()
export class Logger {
  private logger;
  constructor(@inject(TYPES.Config) private readonly config: TConfig) {
    const kibanaURL = this.config.values.LOGGER_ES_URL;

    const transports: winston.transport[] = [new winston.transports.Console()];

    if (kibanaURL) {
      // todo: be sure connection is alive
      const esTransportOpts = {
        level: this.config.values.LOGGER_LEVEL,
        clientOpts: { node: kibanaURL },
      };
      transports.push(new ElasticsearchTransport(esTransportOpts));
      console.log(`Connect logger transport to Kibana: ${kibanaURL}`);
    }

    this.logger = winston.createLogger({
      level: this.config.values.LOGGER_LEVEL,
      format: winston.format.json(),
      transports,
    });
  }

  public info(message: string, meta?: TLoggerMetaData) {
    this.logger.info(message, this.prepareMetadata(meta));
  }

  public error(message: string, meta?: TLoggerMetaData) {
    this.logger.error(message, this.prepareMetadata(meta));
  }

  public debug(message: string, meta?: TLoggerMetaData) {
    this.logger.debug(message, this.prepareMetadata(meta));
  }

  public warn(message: string, meta?: TLoggerMetaData) {
    this.logger.warn(message, this.prepareMetadata(meta));
  }

  private prepareMetadata(meta?: TLoggerMetaData) {
    if (meta instanceof Error) {
      return meta.message;
    }
    return JSON.stringify(meta);
  }
}
