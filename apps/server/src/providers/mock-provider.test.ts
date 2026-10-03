import { describe, expect, it } from 'vitest';
import { sampleRequest } from '../../test/helpers.ts';
import { MockProvider } from './mock-provider.ts';

const provider = new MockProvider();

describe('MockProvider', () => {
  it('starts with the welcome step', async () => {
    const result = await provider.analyze(sampleRequest());
    expect(result.status).toBe('next_step');
    expect(result.instruction).toContain('Mulai');
    expect(result.target?.box).not.toBeNull();
  });

  it('advances only on completed steps and rephrases after trouble', async () => {
    const result = await provider.analyze(
      sampleRequest({
        locale: 'en',
        history: [
          { instruction: 'Start', feedback: 'done' },
          { instruction: 'Choose', feedback: 'cant_find' },
        ],
      }),
    );
    expect(result.instruction).toMatch(/^Take another slow look\. Choose the menu/);
    expect(result.confidence).toBe('medium');
  });

  it('flags the payment step', async () => {
    const history = Array.from({ length: 3 }, () => ({
      instruction: 'x',
      feedback: 'done' as const,
    }));
    const result = await provider.analyze(sampleRequest({ history }));
    expect(result.safety).toMatchObject({ level: 'caution', kind: 'payment' });
  });

  it('finishes after the script ends', async () => {
    const history = Array.from({ length: 4 }, () => ({
      instruction: 'x',
      feedback: 'done' as const,
    }));
    const result = await provider.analyze(sampleRequest({ history }));
    expect(result).toMatchObject({ status: 'done', target: null });
  });

  it('can simulate latency', async () => {
    const slow = new MockProvider(5);
    const startedAt = Date.now();
    await slow.analyze(sampleRequest());
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(4);
  });
});
