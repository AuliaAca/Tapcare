import type { Locale } from '@tapcare/shared';
import { en } from './en.ts';
import { id, type Dictionary, type MessageKey } from './id.ts';

const DICTIONARIES: Record<Locale, Dictionary> = { id, en };

export type TranslateParams = Record<string, string | number>;
export type Translate = (key: MessageKey, params?: TranslateParams) => string;

/** Pure lookup with `{placeholder}` interpolation; unknown placeholders are left visible. */
export function translate(locale: Locale, key: MessageKey, params?: TranslateParams): string {
  const template = DICTIONARIES[locale][key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function detectLocale(languages: readonly string[]): Locale {
  return languages.some((language) => language.toLowerCase().startsWith('id')) ||
    !languages.some((language) => language.toLowerCase().startsWith('en'))
    ? 'id'
    : 'en';
}

export type { MessageKey };
