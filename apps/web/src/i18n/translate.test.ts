import { describe, expect, it } from 'vitest';
import { en } from './en.ts';
import { id } from './id.ts';
import { detectLocale, translate } from './translate.ts';

describe('translate', () => {
  it('interpolates named placeholders', () => {
    expect(translate('id', 'common.step', { n: 3 })).toBe('Langkah 3');
    expect(translate('en', 'practice.stepOf', { n: 1, total: 4 })).toBe('Step 1 of 4');
  });

  it('leaves unknown placeholders visible instead of failing', () => {
    expect(translate('en', 'common.step', {})).toBe('Step {n}');
  });

  it('has the same keys in every language', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(id).sort());
  });

  it('has no empty strings', () => {
    for (const value of [...Object.values(id), ...Object.values(en)])
      expect(value.trim()).not.toBe('');
  });
});

describe('detectLocale', () => {
  it.each([
    [['id-ID', 'en-US'], 'id'],
    [['en-GB'], 'en'],
    [['ja-JP'], 'id'],
    [[], 'id'],
  ] as const)('%j → %s', (languages, expected) => {
    expect(detectLocale(languages)).toBe(expected);
  });
});
