import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSettings } from '../settings/useSettings.ts';
import { IconButton } from './Button.tsx';

export function TopBar({
  title,
  eyebrow,
  onBack,
  onSettings,
  trailing,
}: {
  title?: string;
  eyebrow?: ReactNode;
  onBack?: () => void;
  onSettings?: () => void;
  trailing?: ReactNode;
}) {
  const { t } = useSettings();
  return (
    <header className="flex items-center gap-3 pb-4">
      {onBack && (
        <IconButton label={t('common.back')} onClick={onBack}>
          <ArrowLeft aria-hidden className="size-6" />
        </IconButton>
      )}
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-xs font-bold tracking-widest text-brand-500 uppercase">{eyebrow}</p>
        )}
        {title && <h1 className="line-clamp-2 text-xl leading-tight font-extrabold">{title}</h1>}
      </div>
      {trailing}
      {onSettings && (
        <IconButton label={t('common.settings')} onClick={onSettings}>
          <SettingsIcon aria-hidden className="size-6" />
        </IconButton>
      )}
    </header>
  );
}
