import { describe, expect, it } from 'vitest';
import { clampBox, cleanText, normalizeBox } from './sanitize.ts';

describe('cleanText', () => {
  it('removes control and bidi characters and collapses whitespace', () => {
    expect(cleanText('  Tap\u0000  "Start"\u202E\n now ', 100)).toBe('Tap "Start" now');
  });

  it('truncates with an ellipsis', () => {
    expect(cleanText('abcdefghij', 5)).toBe('abcd…');
  });
});

describe('clampBox', () => {
  it('returns null for null or degenerate boxes', () => {
    expect(clampBox(null)).toBeNull();
    expect(clampBox({ x: 0.5, y: 0.5, width: 0, height: 0.2 })).toBeNull();
    expect(clampBox({ x: Number.NaN, y: 0, width: 0.2, height: 0.2 })).toBeNull();
  });

  it('keeps boxes inside the frame', () => {
    expect(clampBox({ x: 0.9, y: -0.1, width: 0.5, height: 0.3 })).toEqual({
      x: 0.9,
      y: 0,
      width: expect.closeTo(0.1, 5),
      height: 0.3,
    });
  });
});

describe('normalizeBox', () => {
  it('converts pixels to fractions of the frame', () => {
    expect(
      normalizeBox({ x: 100, y: 200, width: 300, height: 100 }, { width: 1000, height: 800 }),
    ).toEqual({
      x: 0.1,
      y: 0.25,
      width: 0.3,
      height: 0.125,
    });
  });
});
