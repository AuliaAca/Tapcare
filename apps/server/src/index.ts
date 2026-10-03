import { serve } from '@hono/node-server';
import { createApp } from './app.ts';
import { ConfigError, loadConfig } from './config.ts';
import { createLogger } from './logger.ts';
import { createProvider } from './providers/factory.ts';
import { GuidanceService } from './services/guidance-service.ts';

function main() {
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    if (error instanceof ConfigError) {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }

  const logger = createLogger({ level: config.logLevel, pretty: config.env === 'development' });
  const service = new GuidanceService(createProvider(config, logger));
  const app = createApp({ config, logger, service });

  const server = serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
    logger.info(
      { port, provider: service.providerName, model: config.model },
      'TapCare server ready',
    );
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'shutting down');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'unhandled promise rejection');
    process.exit(1);
  });
}

main();
