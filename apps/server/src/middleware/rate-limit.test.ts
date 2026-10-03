import { describe, expect, it } from 'vitest';
import { createFixedWindowLimiter } from './rate-limit.ts';

describe('createFixedWindowLimiter', () => {
  it('allows up to the limit, then blocks until the window resets', () => {
    let now = 0;
    const limiter = createFixedWindowLimiter({ limit: 2, windowMs: 60_000, now: () => now });

    expect(limiter.consume('a')).toMatchObject({ allowed: true, remaining: 1 });
    expect(limiter.consume('a')).toMatchObject({ allowed: true, remaining: 0 });
    expect(limiter.consume('a')).toMatchObject({ allowed: false, retryAfterSeconds: 60 });
    expect(limiter.consume('b').allowed).toBe(true);

    now = 60_000;
    expect(limiter.consume('a').allowed).toBe(true);
  });

  it('prunes expired keys when the map is full', () => {
    let now = 0;
    const limiter = createFixedWindowLimiter({
      limit: 1,
      windowMs: 1_000,
      now: () => now,
      maxKeys: 2,
    });
    limiter.consume('a');
    limiter.consume('b');
    now = 2_000;
    expect(limiter.consume('c').allowed).toBe(true);
    expect(limiter.consume('a').allowed).toBe(true);
  });
});
