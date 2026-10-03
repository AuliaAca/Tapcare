import type { Context, MiddlewareHandler } from 'hono';
import { RateLimitedError } from '../errors.ts';

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  consume(key: string): RateLimitDecision;
}

interface Window {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window, in-memory limiter. Good enough for a single instance;
 * swap for a Redis-backed implementation of RateLimiter when scaling out.
 */
export function createFixedWindowLimiter(options: {
  limit: number;
  windowMs: number;
  now?: () => number;
  maxKeys?: number;
}): RateLimiter {
  const { limit, windowMs, now = Date.now, maxKeys = 10_000 } = options;
  const windows = new Map<string, Window>();

  const prune = (at: number) => {
    for (const [key, window] of windows) if (window.resetAt <= at) windows.delete(key);
  };

  return {
    consume(key) {
      const at = now();
      let window = windows.get(key);
      if (!window || window.resetAt <= at) {
        if (windows.size >= maxKeys) prune(at);
        window = { count: 0, resetAt: at + windowMs };
        windows.set(key, window);
      }
      window.count += 1;
      const allowed = window.count <= limit;
      return {
        allowed,
        remaining: Math.max(0, limit - window.count),
        retryAfterSeconds: allowed ? 0 : Math.ceil((window.resetAt - at) / 1000),
      };
    },
  };
}

export function rateLimit(limiter: RateLimiter, keyOf: (c: Context) => string): MiddlewareHandler {
  return async (c, next) => {
    const decision = limiter.consume(keyOf(c));
    c.header('RateLimit-Remaining', String(decision.remaining));
    if (!decision.allowed) {
      // The error handler turns this into a 429 with a Retry-After header.
      throw new RateLimitedError(decision.retryAfterSeconds);
    }
    await next();
  };
}
