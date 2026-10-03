import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translate } from '../i18n/translate.ts';
import { SettingsContext, type SettingsContextValue } from './context.ts';
import { loadSettings, saveSettings, type Settings } from './settings.ts';

function resolveTheme(theme: Settings['theme']): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function SettingsProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: Settings;
}) {
  const [settings, setSettings] = useState<Settings>(() => initial ?? loadSettings());

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  // Reflect settings on <html> so CSS can scale text and switch themes globally.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = settings.locale;
    root.dataset.textScale = settings.textScale;
    root.dataset.theme = resolveTheme(settings.theme);

    if (settings.theme !== 'system') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => (root.dataset.theme = resolveTheme('system'));
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [settings.locale, settings.textScale, settings.theme]);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, update, t: (key, params) => translate(settings.locale, key, params) }),
    [settings, update],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
