import { describe, expect, it } from 'vitest';
import { ApiError } from './api.ts';
import { cn } from './cn.ts';
import { highlightRect } from './geometry.ts';
import { errorMessageKey, spokenText } from './guidance.ts';
import { fitWithin, parseDataUrl } from './image.ts';
import { isValidPhone, toTelHref } from './phone.ts';
import { readJson, writeJson } from './storage.ts';
import { guidance } from '../../test/render.tsx';

describe('fitWithin', () => {
  it('scales the longest edge down to the limit', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1280, height: 960 });
    expect(fitWithin(1080, 1920)).toEqual({ width: 720, height: 1280 });
  });

  it('never scales up', () => {
    expect(fitWithin(640, 480)).toEqual({ width: 640, height: 480 });
  });

  it('rejects empty images', () => {
    expect(() => fitWithin(0, 100)).toThrow();
  });
});

describe('parseDataUrl', () => {
  it('splits media type and data', () => {
    expect(parseDataUrl('data:image/jpeg;base64,QUJD')).toEqual({
      mediaType: 'image/jpeg',
      data: 'QUJD',
    });
  });

  it('rejects other strings', () => {
    expect(() => parseDataUrl('https://example.com/a.jpg')).toThrow();
  });
});

describe('highlightRect', () => {
  it('enlarges tiny boxes around their centre and keeps them in frame', () => {
    const rect = highlightRect({ x: 0.98, y: 0.5, width: 0.01, height: 0.01 });
    expect(rect.width).toBe(0.08);
    expect(rect.x + rect.width).toBeLessThanOrEqual(1);
    expect(rect.y).toBeCloseTo(0.465);
  });

  it('keeps large boxes unchanged', () => {
    const box = { x: 0.1, y: 0.1, width: 0.5, height: 0.2 };
    expect(highlightRect(box)).toEqual(box);
  });
});

describe('phone helpers', () => {
  it.each(['0812-3456-7890', '+62 812 3456 7890', '(021) 555-1234'])('accepts %s', (value) => {
    expect(isValidPhone(value)).toBe(true);
  });

  it.each(['abc', '12', 'javascript:alert(1)', '+62 812 ext 9'])('rejects %s', (value) => {
    expect(isValidPhone(value)).toBe(false);
  });

  it('builds a clean tel: link', () => {
    expect(toTelHref('+62 812-3456')).toBe('tel:+628123456');
    expect(toTelHref('0812 3456')).toBe('tel:08123456');
  });
});

describe('storage', () => {
  it('round-trips JSON', () => {
    writeJson('k', { a: 1 });
    expect(readJson('k', null)).toEqual({ a: 1 });
  });

  it('falls back on corrupt data', () => {
    localStorage.setItem('k', '{oops');
    expect(readJson('k', 'fallback')).toBe('fallback');
  });
});

describe('guidance helpers', () => {
  it('speaks the safety message after the instruction', () => {
    expect(
      spokenText(
        guidance({ safety: { level: 'caution', kind: 'payment', message: 'Cek jumlahnya.' } }),
      ),
    ).toBe('Tekan "Beli Tiket". Cek jumlahnya.');
  });

  it('maps error codes to friendly messages', () => {
    expect(errorMessageKey('NETWORK')).toBe('error.network');
    expect(errorMessageKey('RATE_LIMITED')).toBe('error.busy');
    expect(errorMessageKey('BAD_RESPONSE')).toBe('error.generic');
    expect(errorMessageKey(null)).toBe('error.generic');
  });
});

describe('cn', () => {
  it('skips falsy values', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b');
  });
});

describe('ApiError', () => {
  it('carries a code and status', () => {
    const error = new ApiError('RATE_LIMITED', 'slow', 429);
    expect(error).toMatchObject({ code: 'RATE_LIMITED', status: 429, name: 'ApiError' });
  });
});
