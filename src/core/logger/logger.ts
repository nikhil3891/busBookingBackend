import winston from 'winston';
import { env } from '../config/env.config';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  simple(),
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

export const logger = winston.createLogger({
  level: env.node.isProd ? 'info' : 'debug',
  format: env.node.isProd ? prodFormat : devFormat,
  defaultMeta: { service: 'bus-booking-api' },
  transports: [
    new winston.transports.Console(),
    ...(env.node.isProd
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});

export type Logger = typeof logger;
