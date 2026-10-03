import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ErrorCode } from '@tapcare/shared';

/**
 * Base class for errors that are safe to show to the client.
 * Anything that is not an AppError is treated as an unexpected 500 and its details are hidden.
 */
export class AppError extends Error {
  override name = 'AppError';

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: ContentfulStatusCode,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}

export class ValidationError extends AppError {
  override name = 'ValidationError';
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
  }
}

export class PayloadTooLargeError extends AppError {
  override name = 'PayloadTooLargeError';
  constructor() {
    super('PAYLOAD_TOO_LARGE', 'The photo is too large. Please try again.', 413);
  }
}

export class RateLimitedError extends AppError {
  override name = 'RateLimitedError';
  constructor(readonly retryAfterSeconds: number) {
    super('RATE_LIMITED', 'Too many requests. Please wait a moment.', 429);
  }
}

export class UpstreamUnavailableError extends AppError {
  override name = 'UpstreamUnavailableError';
  constructor(message: string, options?: { cause?: unknown }) {
    super('UPSTREAM_UNAVAILABLE', message, 503, options);
  }
}

export class UpstreamRefusedError extends AppError {
  override name = 'UpstreamRefusedError';
  constructor() {
    super('UPSTREAM_REFUSED', 'This screen cannot be analysed. Please ask a staff member.', 422);
  }
}

export class NotFoundError extends AppError {
  override name = 'NotFoundError';
  constructor() {
    super('NOT_FOUND', 'Not found', 404);
  }
}
