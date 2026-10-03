import { describe, expect, it } from 'vitest';
import { ApiErrorBodySchema, GuidanceResponseSchema } from '@tapcare/shared';
import { createApp } from '../src/app.ts';
import { UpstreamUnavailableError } from '../src/errors.ts';
import { createFixedWindowLimiter } from '../src/middleware/rate-limit.ts';
import { MockProvider } from '../src/providers/mock-provider.ts';
import type { GuidanceProvider } from '../src/providers/types.ts';
import { GuidanceService } from '../src/services/guidance-service.ts';
import { sampleImage, silentLogger, testConfig } from './helpers.ts';

const build = (options: { provider?: GuidanceProvider; limit?: number } = {}) =>
  createApp({
    config: testConfig(),
    logger: silentLogger,
    service: new GuidanceService(options.provider ?? new MockProvider()),
    limiter: createFixedWindowLimiter({ limit: options.limit ?? 100, windowMs: 60_000 }),
  });

const post = (app: ReturnType<typeof build>, body: unknown, headers: Record<string, string> = {}) =>
  app.request('/api/guidance', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const validBody = { goal: 'Beli tiket kereta', locale: 'id', image: sampleImage };

describe('GET /api/health', () => {
  it('reports status and provider', async () => {
    const res = await build().request('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', provider: 'mock', version: '0.1.0' });
  });

  it('sets security headers', async () => {
    const res = await build().request('/api/health');
    expect(res.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });
});

describe('POST /api/guidance', () => {
  it('returns guidance that matches the shared contract', async () => {
    const res = await post(build(), validBody);
    expect(res.status).toBe(200);
    const body = GuidanceResponseSchema.parse(await res.json());
    expect(body).toMatchObject({ status: 'next_step', stepNumber: 1, meta: { provider: 'mock' } });
  });

  it('rejects invalid input with a readable 400', async () => {
    const res = await post(build(), { ...validBody, locale: 'fr' });
    expect(res.status).toBe(400);
    const body = ApiErrorBodySchema.parse(await res.json());
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('locale');
  });

  it('rejects malformed JSON', async () => {
    const res = await post(build(), '{nope');
    expect(res.status).toBe(400);
  });

  it('rejects oversized payloads with 413', async () => {
    const res = await post(build(), {
      ...validBody,
      image: { ...sampleImage, data: 'A'.repeat(3_000_000) },
    });
    expect(res.status).toBe(413);
    expect(ApiErrorBodySchema.parse(await res.json()).error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('rate limits with Retry-After', async () => {
    const app = build({ limit: 1 });
    expect((await post(app, validBody)).status).toBe(200);
    const res = await post(app, validBody);
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('60');
  });

  it('maps provider failures to clean error responses', async () => {
    const failing: GuidanceProvider = {
      name: 'claude',
      analyze: () => Promise.reject(new UpstreamUnavailableError('busy')),
    };
    const res = await post(build({ provider: failing }), validBody);
    expect(res.status).toBe(503);
    expect(ApiErrorBodySchema.parse(await res.json()).error).toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      message: 'busy',
    });
  });

  it('hides unexpected errors behind a generic 500', async () => {
    const crashing: GuidanceProvider = {
      name: 'claude',
      analyze: () => Promise.reject(new Error('secret stack detail')),
    };
    const res = await post(build({ provider: crashing }), validBody);
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toContain('secret');
  });

  it('allows configured origins only', async () => {
    const allowed = await build().request('/api/health', {
      headers: { origin: 'http://localhost:5173' },
    });
    expect(allowed.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
    const denied = await build().request('/api/health', {
      headers: { origin: 'https://evil.example' },
    });
    expect(denied.headers.get('access-control-allow-origin')).toBeNull();
  });
});

describe('unknown routes', () => {
  it('returns JSON 404 for unknown API paths', async () => {
    const res = await build().request('/api/nope');
    expect(res.status).toBe(404);
    expect(ApiErrorBodySchema.parse(await res.json()).error.code).toBe('NOT_FOUND');
  });

  it('returns 404 for non-API paths when no static dir is configured', async () => {
    expect((await build().request('/somewhere')).status).toBe(404);
  });
});
