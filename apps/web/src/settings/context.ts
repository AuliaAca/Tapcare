import { createContext } from 'react';
import type { Translate } from '../i18n/translate.ts';
import type { Settings } from './settings.ts';

export interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  t: Translate;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);
