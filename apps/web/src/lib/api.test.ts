import { describe, expect, it, vi } from 'vitest';
import type { GuidanceRequest } from '@tapcare/shared';
import { guidance } from '../../test/render.tsx';
import { ApiError, requestGuidance } from './api.ts';

const body: GuidanceRequest = {
  goal: 'Beli tiket',
  locale: 'id',
  image: { mediaType: 'image/jpeg', data: 'A'.repeat(200), width: 640, height: 480 },
};

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

describe('requestGuidance', () => {
  it('posts JSON and returns validated guidance', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(200, guidance()));
    const result = await requestGuidance(body, { fetchImpl });

    expect(result.instruction).toBe('Tekan "Beli Tiket".');
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe('/api/guidance');
    expect(init).toMatchObject({ method: 'POST', headers: { 'content-type': 'application/json' } });
    expect(JSON.parse(init.body)).toEqual(body);
  });

  it('surfaces server error codes', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        json(429, { error: { code: 'RATE_LIMITED', message: 'Too many', requestId: 'r' } }),
      );
    await expect(requestGuidance(body, { fetchImpl })).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      status: 429,
    });
  });

  it('flags unexpected error bodies', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('<html>502</html>', { status: 502 }));
    await expect(requestGuidance(body, { fetchImpl })).rejects.toMatchObject({
      code: 'BAD_RESPONSE',
    });
  });

  it('rejects successful responses that break the contract', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(200, { instruction: 'tap' }));
    await expect(requestGuidance(body, { fetchImpl })).rejects.toMatchObject({
      code: 'BAD_RESPONSE',
    });
  });

  it('reports network failures', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(requestGuidance(body, { fetchImpl })).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('distinguishes cancellation from timeouts', async () => {
    const hang: typeof fetch = (_url, init) =>
      new Promise((_resolve, reject) =>
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        ),
      );

    const controller = new AbortController();
    const cancelled = requestGuidance(body, { fetchImpl: hang, signal: controller.signal });
    controller.abort();
    await expect(cancelled).rejects.toMatchObject({ code: 'ABORTED' });

    await expect(requestGuidance(body, { fetchImpl: hang, timeoutMs: 5 })).rejects.toBeInstanceOf(
      ApiError,
    );
    await expect(requestGuidance(body, { fetchImpl: hang, timeoutMs: 5 })).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });
});
