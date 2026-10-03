import { z } from 'zod';
import { LocaleSchema } from '@tapcare/shared';
import { detectLocale } from '../i18n/translate.ts';
import { isValidPhone } from '../lib/phone.ts';
import { readJson, writeJson } from '../lib/storage.ts';

export const STORAGE_KEY = 'tapcare.settings.v1';

export const SettingsSchema = z.object({
  locale: LocaleSchema,
  textScale: z.enum(['md', 'lg', 'xl']),
  theme: z.enum(['system', 'light', 'dark']),
  voice: z.boolean(),
  speechRate: z.union([z.literal(0.85), z.literal(1)]),
  haptics: z.boolean(),
  contact: z
    .object({
      name: z.string().trim().min(1).max(40),
      phone: z.string().refine(isValidPhone),
    })
    .nullable(),
});
export type Settings = z.infer<typeof SettingsSchema>;

export function defaultSettings(
  languages: readonly string[] = navigator.languages ?? [],
): Settings {
  return {
    locale: detectLocale(languages),
    // Large text and slower speech by default: the primary audience is older adults.
    textScale: 'lg',
    theme: 'system',
    voice: true,
    speechRate: 0.85,
    haptics: true,
    contact: null,
  };
}

/** Loads saved settings, keeping any valid field and replacing anything corrupt with defaults. */
export function loadSettings(): Settings {
  const defaults = defaultSettings();
  const stored = readJson<unknown>(STORAGE_KEY, null);
  if (!stored || typeof stored !== 'object') return defaults;

  const merged = { ...defaults, ...stored };
  const parsed = SettingsSchema.safeParse(merged);
  if (parsed.success) return parsed.data;

  const repaired: Record<string, unknown> = { ...defaults };
  for (const key of Object.keys(SettingsSchema.shape) as (keyof Settings)[]) {
    const field = SettingsSchema.shape[key].safeParse((stored as Record<string, unknown>)[key]);
    if (field.success) repaired[key] = field.data;
  }
  return SettingsSchema.parse(repaired);
}

export function saveSettings(settings: Settings): void {
  writeJson(STORAGE_KEY, settings);
}
