import { FlaskConical } from 'lucide-react';
import { useSettings } from '../settings/useSettings.ts';

/** Makes it obvious when answers come from the offline demo script rather than the AI. */
export function ProviderBadge({ provider }: { provider: 'claude' | 'mock' }) {
  const { t } = useSettings();
  if (provider !== 'mock') return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-caution-50 px-3 py-1 text-xs font-bold text-[oklch(0.45_0.12_60)] ring-1 ring-caution-500/40">
      <FlaskConical aria-hidden className="size-3.5" />
      {t('common.demoMode')}
    </span>
  );
}
