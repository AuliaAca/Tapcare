import { describe, expect, it } from 'vitest';
import { defaultSettings, loadSettings, saveSettings, STORAGE_KEY } from './settings.ts';

describe('settings', () => {
  it('defaults favour older users: large text, slower voice', () => {
    expect(defaultSettings(['id-ID'])).toMatchObject({
      locale: 'id',
      textScale: 'lg',
      speechRate: 0.85,
      voice: true,
    });
  });

  it('round-trips through storage', () => {
    const settings = { ...defaultSettings(['en-US']), textScale: 'xl' as const };
    saveSettings(settings);
    expect(loadSettings()).toEqual(settings);
  });

  it('repairs corrupt fields without losing valid ones', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ textScale: 'xl', speechRate: 9, contact: { name: 'Budi', phone: 'nope' } }),
    );
    const settings = loadSettings();
    expect(settings.textScale).toBe('xl');
    expect(settings.speechRate).toBe(0.85);
    expect(settings.contact).toBeNull();
  });

  it('ignores non-object storage values', () => {
    localStorage.setItem(STORAGE_KEY, '"hello"');
    expect(loadSettings().textScale).toBe('lg');
  });
});
