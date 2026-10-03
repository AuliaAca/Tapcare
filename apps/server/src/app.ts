import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { getConnInfo } from '@hono/node-server/conninfo';
import { serveStatic } from '@hono/node-server/serve-static';
import { z } from 'zod';
import { GuidanceRequestSchema, type ApiErrorBody, type HealthResponse } from '@tapcare/shared';
import type { AppConfig } from './config.ts';
import {
  AppError,
  NotFoundError,
  PayloadTooLargeError,
  RateLimitedError,
  ValidationError,
} from './errors.ts';
import type { Logger } from './logger.ts';
import { createFixedWindowLimiter, rateLimit, type RateLimiter } from './middleware/rate-limit.ts';
import type { GuidanceService } from './services/guidance-service.ts';

export const APP_VERSION = '0.1.0';
const MAX_BODY_BYTES = 2.5 * 1024 * 1024;

interface Env {
  Variables: { requestId: string };
}

export interface AppDeps {
  config: AppConfig;
  logger: Logger;
  service: GuidanceService;
  limiter?: RateLimiter;
}

export function createApp({ config, logger, service, limiter }: AppDeps) {
  const app = new Hono<Env>();
  const guidanceLimiter =
    limiter ?? createFixedWindowLimiter({ limit: config.rateLimitPerMinute, windowMs: 60_000 });

  app.use('*', requestId());
  app.use(
    '*',
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // Animation libraries write inline style attributes.
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        mediaSrc: ["'self'", 'blob:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
      permissionsPolicy: { camera: ['self'], microphone: ['self'], geolocation: [] },
    }),
  );
  app.use('*', async (c, next) => {
    const startedAt = performance.now();
    await next();
    logger.info(
      {
        requestId: c.get('requestId'),
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs: Math.round(performance.now() - startedAt),
      },
      'request',
    );
  });
  app.use(
    '/api/*',
    cors({ origin: config.allowedOrigins, allowMethods: ['GET', 'POST'], maxAge: 600 }),
  );

  app.get('/api/health', (c) =>
    c.json<HealthResponse>({ status: 'ok', provider: service.providerName, version: APP_VERSION }),
  );

  app.post(
    '/api/guidance',
    bodyLimit({
      maxSize: MAX_BODY_BYTES,
      onError: () => {
        throw new PayloadTooLargeError();
      },
    }),
    rateLimit(guidanceLimiter, (c) => clientKey(c, config.trustProxy)),
    async (c) => {
      const body: unknown = await c.req.json().catch(() => {
        throw new ValidationError('Request body must be valid JSON.');
      });
      const parsed = GuidanceRequestSchema.safeParse(body);
      if (!parsed.success) throw new ValidationError(z.prettifyError(parsed.error));

      const guidance = await service.guide(parsed.data, {
        requestId: c.get('requestId'),
        signal: c.req.raw.signal,
      });
      return c.json(guidance);
    },
  );

  app.all('/api/*', () => {
    throw new NotFoundError();
  });

  if (config.staticDir) {
    app.use('*', serveStatic({ root: config.staticDir }));
    // Single-page app: unknown routes fall back to index.html.
    app.get('*', serveStatic({ root: config.staticDir, path: 'index.html' }));
  }

  app.notFound((c) => errorResponse(c, new NotFoundError()));

  app.onError((error, c) => {
    if (error instanceof AppError) {
      const log = error.status >= 500 ? logger.error.bind(logger) : logger.warn.bind(logger);
      log(
        { requestId: c.get('requestId'), code: error.code, err: error.cause ?? undefined },
        error.message,
      );
      if (error instanceof RateLimitedError)
        c.header('Retry-After', String(error.retryAfterSeconds));
      return errorResponse(c, error);
    }
    if (error instanceof HTTPException) {
      logger.warn({ requestId: c.get('requestId'), status: error.status }, error.message);
      return errorResponse(c, new ValidationError(error.message || 'Bad request'));
    }
    logger.error({ requestId: c.get('requestId'), err: error }, 'unhandled error');
    return errorResponse(
      c,
      new AppError('INTERNAL_ERROR', 'Something went wrong on our side.', 500),
    );
  });

  return app;
}

function errorResponse(c: Context<Env>, error: AppError) {
  const body: ApiErrorBody = {
    error: { code: error.code, message: error.message, requestId: c.get('requestId') },
  };
  return c.json(body, error.status);
}

/** Identifies a client for rate limiting. Only trusts X-Forwarded-For behind a known proxy. */
function clientKey(c: Context, trustProxy: boolean): string {
  if (trustProxy) {
    const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return forwarded;
  }
  try {
    return getConnInfo(c).remote.address ?? 'unknown';
  } catch {
    return 'unknown';
  }
}
