import { ShieldAlert, OctagonAlert } from 'lucide-react';
import type { Safety } from '@tapcare/shared';
import { cn } from '../lib/cn.ts';
import { useSettings } from '../settings/useSettings.ts';

export function SafetyBanner({ safety }: { safety: Safety }) {
  const { t } = useSettings();
  if (safety.level === 'none' || !safety.message) return null;
  const stop = safety.level === 'stop';
  const Icon = stop ? OctagonAlert : ShieldAlert;

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-2xl p-4 ring-1',
        stop
          ? 'bg-danger-50 text-danger-500 ring-danger-500/30'
          : 'bg-caution-50 text-[oklch(0.45_0.12_60)] ring-caution-500/40',
      )}
    >
      <Icon aria-hidden className="mt-0.5 size-7 shrink-0" />
      <div>
        <p className="font-extrabold">{t(stop ? 'safety.stop' : 'safety.caution')}</p>
        <p className="leading-snug font-medium">{safety.message}</p>
      </div>
    </div>
  );
}
