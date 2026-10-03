import { Camera, Hand, MessageCircle, Phone, ShieldCheck, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { toTelHref } from '../lib/phone.ts';
import { useSettings } from '../settings/useSettings.ts';
import { Sheet } from './Sheet.tsx';

function Row({ icon, title, body }: { icon: ReactNode; title?: string; body: string }) {
  return (
    <li className="flex gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-700/30 dark:text-brand-200">
        {icon}
      </span>
      <div>
        {title && <p className="font-extrabold">{title}</p>}
        <p className="leading-snug text-ink-muted">{body}</p>
      </div>
    </li>
  );
}

export function HowItWorksSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useSettings();
  return (
    <Sheet open={open} title={t('how.title')} onClose={onClose}>
      <ol className="space-y-5">
        <Row
          icon={<MessageCircle aria-hidden />}
          title={t('how.step1.title')}
          body={t('how.step1.body')}
        />
        <Row
          icon={<Camera aria-hidden />}
          title={t('how.step2.title')}
          body={t('how.step2.body')}
        />
        <Row icon={<Hand aria-hidden />} title={t('how.step3.title')} body={t('how.step3.body')} />
      </ol>
      <p className="mt-6 flex items-center gap-2 rounded-2xl bg-success-50 p-4 font-semibold text-[oklch(0.4_0.1_152)]">
        <ShieldCheck aria-hidden className="size-6 shrink-0" />
        {t('how.safety')}
      </p>
    </Sheet>
  );
}

export function HelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, settings } = useSettings();
  const contact = settings.contact;
  return (
    <Sheet open={open} title={t('help.title')} onClose={onClose}>
      <ul className="space-y-5">
        <Row icon={<UserRound aria-hidden />} body={t('help.staff')} />
        <Row icon={<Phone aria-hidden />} body={t('help.family')} />
      </ul>
      <div className="mt-6">
        {contact ? (
          <a
            href={toTelHref(contact.phone)}
            className="flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-success-500 px-6 text-lg font-bold text-white shadow-lg"
          >
            <Phone aria-hidden />
            {t('help.call', { name: contact.name })}
          </a>
        ) : (
          <p className="rounded-2xl bg-surface-muted p-4 text-ink-muted">{t('help.noContact')}</p>
        )}
      </div>
      <p className="mt-4 rounded-2xl bg-danger-50 p-4 font-semibold text-danger-500">
        {t('help.never')}
      </p>
    </Sheet>
  );
}
