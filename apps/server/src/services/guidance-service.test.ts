import { describe, expect, it } from 'vitest';
import { sampleRequest } from '../../test/helpers.ts';
import { MockProvider } from '../providers/mock-provider.ts';
import type { GuidanceProvider, ProviderGuidance } from '../providers/types.ts';
import { GuidanceService, postProcess } from './guidance-service.ts';

const base: ProviderGuidance = {
  status: 'next_step',
  instruction: 'Tap Start',
  screenSummary: 'Welcome',
  target: { label: 'Start', hint: 'centre', box: { x: 0.2, y: 0.2, width: 0.3, height: 0.1 } },
  safety: { level: 'none', kind: 'none', message: null },
  confidence: 'high',
};

describe('GuidanceService', () => {
  it('adds step number and metadata', async () => {
    let tick = 0;
    const service = new GuidanceService(new MockProvider(), () => (tick += 25));
    const result = await service.guide(
      sampleRequest({
        history: [
          { instruction: 'a', feedback: 'done' },
          { instruction: 'b', feedback: 'cant_find' },
        ],
      }),
      { requestId: 'req-1' },
    );
    expect(result.stepNumber).toBe(2);
    expect(result.meta).toEqual({ provider: 'mock', latencyMs: 25, requestId: 'req-1' });
    expect(service.providerName).toBe('mock');
  });

  it('forwards the abort signal to the provider', async () => {
    let received: AbortSignal | undefined;
    const provider: GuidanceProvider = {
      name: 'mock',
      analyze: async (_request, signal) => {
        received = signal;
        return base;
      },
    };
    const controller = new AbortController();
    await new GuidanceService(provider).guide(sampleRequest(), {
      requestId: 'r',
      signal: controller.signal,
    });
    expect(received).toBe(controller.signal);
  });
});

describe('postProcess', () => {
  it('cleans text fields', () => {
    const result = postProcess({ ...base, instruction: '  Tap\u0007   Start  ' }, 'en');
    expect(result.instruction).toBe('Tap Start');
  });

  it('fills a default safety message for PIN screens and raises the level', () => {
    const result = postProcess(
      { ...base, safety: { level: 'none', kind: 'pin_entry', message: null } },
      'id',
    );
    expect(result.safety.level).toBe('caution');
    expect(result.safety.message).toMatch(/PIN/);
  });

  it('turns suspicious screens into a hand-off with no target', () => {
    const result = postProcess(
      { ...base, safety: { level: 'caution', kind: 'suspicious', message: ' Looks like a scam ' } },
      'en',
    );
    expect(result).toMatchObject({
      status: 'needs_human',
      target: null,
      safety: { level: 'stop', kind: 'suspicious', message: 'Looks like a scam' },
    });
  });

  it('keeps a model "stop" even without a safety kind', () => {
    const result = postProcess(
      { ...base, safety: { level: 'stop', kind: 'none', message: '' } },
      'en',
    );
    expect(result.status).toBe('needs_human');
    expect(result.safety.message).toBeNull();
  });

  it('downgrades confidence when there is no box to show', () => {
    const result = postProcess({ ...base, target: { label: 'Start', hint: '', box: null } }, 'en');
    expect(result.confidence).toBe('medium');
  });

  it('drops targets on non-tap statuses', () => {
    expect(postProcess({ ...base, status: 'done' }, 'en').target).toBeNull();
  });
});
