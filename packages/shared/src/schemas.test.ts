import { describe, expect, it } from 'vitest';
import {
  GuidanceRequestSchema,
  GuidanceResponseSchema,
  MAX_HISTORY_STEPS,
  MAX_IMAGE_BASE64_LENGTH,
} from './schemas.ts';

const validImage = { mediaType: 'image/jpeg', data: 'A'.repeat(200), width: 1280, height: 960 };

describe('GuidanceRequestSchema', () => {
  it('accepts a minimal valid request and defaults history', () => {
    const parsed = GuidanceRequestSchema.parse({
      goal: 'Beli tiket kereta',
      locale: 'id',
      image: validImage,
    });
    expect(parsed.history).toEqual([]);
  });

  it('trims the goal', () => {
    const parsed = GuidanceRequestSchema.parse({
      goal: '   Order food  ',
      locale: 'en',
      image: validImage,
    });
    expect(parsed.goal).toBe('Order food');
  });

  it.each([
    ['empty goal', { goal: ' ' }],
    ['unknown locale', { locale: 'fr' }],
    ['tiny frame', { image: { ...validImage, width: 10 } }],
    ['svg image', { image: { ...validImage, mediaType: 'image/svg+xml' } }],
    [
      'data URL prefix',
      { image: { ...validImage, data: `data:image/jpeg;base64,${'A'.repeat(200)}` } },
    ],
    [
      'oversized image',
      { image: { ...validImage, data: 'A'.repeat(MAX_IMAGE_BASE64_LENGTH + 4) } },
    ],
    [
      'too much history',
      {
        history: Array.from({ length: MAX_HISTORY_STEPS + 1 }, () => ({
          instruction: 'Tap start',
          feedback: 'done',
        })),
      },
    ],
  ])('rejects %s', (_name, override) => {
    const result = GuidanceRequestSchema.safeParse({
      goal: 'Beli tiket',
      locale: 'id',
      image: validImage,
      ...override,
    });
    expect(result.success).toBe(false);
  });
});

describe('GuidanceResponseSchema', () => {
  it('rejects a bounding box outside the frame', () => {
    const result = GuidanceResponseSchema.safeParse({
      status: 'next_step',
      instruction: 'Tap Start',
      screenSummary: 'Welcome screen',
      target: {
        label: 'Start',
        hint: 'big button',
        box: { x: 1.2, y: 0, width: 0.1, height: 0.1 },
      },
      safety: { level: 'none', kind: 'none', message: null },
      confidence: 'high',
      stepNumber: 1,
      meta: { provider: 'mock', latencyMs: 3, requestId: 'r1' },
    });
    expect(result.success).toBe(false);
  });
});
