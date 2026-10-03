import { pino, type Logger } from 'pino';

export type { Logger };

/**
 * Structured JSON logs in production, pretty logs in development.
 * Camera frames and credentials are redacted defensively even though we never log them on purpose.
 */
export function createLogger(options: { level: string; pretty: boolean }): Logger {
  return pino({
    level: options.level,
    base: { service: 'tapcare-server' },
    redact: {
      paths: [
        'apiKey',
        '*.apiKey',
        'image',
        '*.image',
        'req.headers.authorization',
        'req.headers.cookie',
      ],
      censor: '[redacted]',
    },
    ...(options.pretty
      ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
      : {}),
  });
}
