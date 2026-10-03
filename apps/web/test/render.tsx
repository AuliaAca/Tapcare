import { render, type RenderOptions } from '@testing-library/react';
import { LazyMotion, domAnimation } from 'motion/react';
import type { ReactElement } from 'react';
import type { GuidanceResponse } from '@tapcare/shared';
import { defaultSettings, type Settings } from '../src/settings/settings.ts';
import { SettingsProvider } from '../src/settings/SettingsContext.tsx';

export function renderWithSettings(
  ui: ReactElement,
  { settings, ...options }: { settings?: Partial<Settings> } & RenderOptions = {},
) {
  const initial: Settings = {
    ...defaultSettings(['id-ID']),
    voice: false,
    haptics: false,
    ...settings,
  };
  return render(
    <SettingsProvider initial={initial}>
      <LazyMotion features={domAnimation}>{ui}</LazyMotion>
    </SettingsProvider>,
    options,
  );
}

export const guidance = (overrides: Partial<GuidanceResponse> = {}): GuidanceResponse => ({
  status: 'next_step',
  instruction: 'Tekan "Beli Tiket".',
  screenSummary: 'Layar utama kiosk',
  target: {
    label: 'Beli Tiket',
    hint: 'tombol biru, atas',
    box: { x: 0.1, y: 0.2, width: 0.3, height: 0.1 },
  },
  safety: { level: 'none', kind: 'none', message: null },
  confidence: 'high',
  stepNumber: 1,
  meta: { provider: 'claude', latencyMs: 1200, requestId: 'req-1' },
  ...overrides,
});
