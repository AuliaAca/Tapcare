import { useState, type FormEvent } from 'react';
import { isValidPhone } from '../lib/phone.ts';
import type { Settings } from '../settings/settings.ts';
import { useSettings } from '../settings/useSettings.ts';
import { Button } from './Button.tsx';
import { Segmented, Toggle } from './Segmented.tsx';
import { Sheet } from './Sheet.tsx';

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, update, t } = useSettings();

  return (
    <Sheet open={open} title={t('settings.title')} onClose={onClose}>
      <div className="space-y-6 pb-2">
        <Segmented
          label={t('settings.language')}
          value={settings.locale}
          onChange={(locale) => update({ locale })}
          options={[
            { value: 'id', label: 'Indonesia' },
            { value: 'en', label: 'English' },
          ]}
        />
        <Segmented<Settings['textScale']>
          label={t('settings.textSize')}
          value={settings.textScale}
          onChange={(textScale) => update({ textScale })}
          options={[
            { value: 'md', label: t('settings.textSize.md') },
            { value: 'lg', label: t('settings.textSize.lg') },
            { value: 'xl', label: t('settings.textSize.xl') },
          ]}
        />
        <Segmented<Settings['theme']>
          label={t('settings.theme')}
          value={settings.theme}
          onChange={(theme) => update({ theme })}
          options={[
            { value: 'system', label: t('settings.theme.system') },
            { value: 'light', label: t('settings.theme.light') },
            { value: 'dark', label: t('settings.theme.dark') },
          ]}
        />
        <div className="divide-y divide-line">
          <Toggle
            label={t('settings.voice')}
            checked={settings.voice}
            onChange={(voice) => update({ voice })}
          />
          <Toggle
            label={t('settings.haptics')}
            checked={settings.haptics}
            onChange={(haptics) => update({ haptics })}
          />
        </div>
        {settings.voice && (
          <Segmented<Settings['speechRate']>
            label={t('settings.speechRate')}
            value={settings.speechRate}
            onChange={(speechRate) => update({ speechRate })}
            options={[
              { value: 0.85, label: t('settings.speechRate.slow') },
              { value: 1, label: t('settings.speechRate.normal') },
            ]}
          />
        )}
        <ContactForm />
      </div>
    </Sheet>
  );
}

function ContactForm() {
  const { settings, update, t } = useSettings();
  const [name, setName] = useState(settings.contact?.name ?? '');
  const [phone, setPhone] = useState(settings.contact?.phone ?? '');
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() && !phone.trim()) {
      update({ contact: null });
      setSaved(true);
      return;
    }
    if (!name.trim() || !isValidPhone(phone)) {
      setError(true);
      return;
    }
    setError(false);
    update({ contact: { name: name.trim(), phone: phone.trim() } });
    setSaved(true);
  };

  const inputClass =
    'mt-1 block min-h-14 w-full rounded-2xl bg-surface-muted px-4 text-lg ring-1 ring-line focus:ring-2 focus:ring-brand-400 focus:outline-none';

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <h3 className="font-bold">{t('settings.contact')}</h3>
      <label className="block text-sm font-semibold text-ink-muted">
        {t('settings.contactName')}
        <input
          className={inputClass}
          value={name}
          maxLength={40}
          autoComplete="name"
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
          }}
        />
      </label>
      <label className="block text-sm font-semibold text-ink-muted">
        {t('settings.contactPhone')}
        <input
          className={inputClass}
          value={phone}
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          aria-invalid={error}
          onChange={(event) => {
            setPhone(event.target.value);
            setSaved(false);
          }}
        />
      </label>
      {error && (
        <p role="alert" className="font-semibold text-danger-500">
          {t('settings.contactInvalid')}
        </p>
      )}
      <Button type="submit" variant="secondary" size="md">
        {saved ? t('settings.contactSaved') : t('settings.contactSave')}
      </Button>
      <p className="text-sm text-ink-muted">{t('settings.saved')}</p>
    </form>
  );
}
