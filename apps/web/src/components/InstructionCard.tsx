import { Search, Volume2 } from 'lucide-react';
import type { GuidanceResponse } from '@tapcare/shared';
import { useSettings } from '../settings/useSettings.ts';
import { IconButton } from './Button.tsx';
import { SafetyBanner } from './SafetyBanner.tsx';

/** The single instruction the user should follow now. Announced to screen readers as it changes. */
export function InstructionCard({
  guidance,
  onRepeat,
}: {
  guidance: GuidanceResponse;
  onRepeat?: () => void;
}) {
  const { t } = useSettings();
  const { target } = guidance;
  return (
    <section className="space-y-3 rounded-[var(--radius-card)] bg-surface p-5 shadow-lg ring-1 ring-line">
      <div className="flex items-start gap-3">
        <p aria-live="polite" className="flex-1 text-2xl leading-snug font-extrabold text-balance">
          {guidance.instruction}
        </p>
        {onRepeat && (
          <IconButton
            label={t('live.repeat')}
            onClick={onRepeat}
            className="bg-brand-50 text-brand-600 ring-0"
          >
            <Volume2 aria-hidden className="size-6" />
          </IconButton>
        )}
      </div>
      {target && (target.label || target.hint) && (
        <p className="flex items-center gap-2 rounded-2xl bg-surface-muted px-4 py-3 text-base">
          <Search aria-hidden className="size-5 shrink-0 text-brand-500" />
          <span>
            <span className="font-bold">{t('live.lookFor')}</span>{' '}
            {[target.label && `“${target.label}”`, target.hint].filter(Boolean).join(' — ')}
          </span>
        </p>
      )}
      {guidance.confidence === 'low' && guidance.status === 'next_step' && (
        <p className="text-sm font-semibold text-ink-muted">{t('live.lowConfidence')}</p>
      )}
      <SafetyBanner safety={guidance.safety} />
    </section>
  );
}
