import { CarFront, CreditCard, ListOrdered, Mic, MicOff, TrainFront, Utensils } from 'lucide-react';
import { useCallback, useState, type FormEvent, type ReactNode } from 'react';
import { MAX_GOAL_LENGTH } from '@tapcare/shared';
import { Button, IconButton } from '../components/Button.tsx';
import { Screen } from '../components/Screen.tsx';
import { TopBar } from '../components/TopBar.tsx';
import { useVoiceInput } from '../hooks/useVoiceInput.ts';
import type { MessageKey } from '../i18n/translate.ts';
import { cn } from '../lib/cn.ts';
import { useSettings } from '../settings/useSettings.ts';

const PRESETS: { key: MessageKey; icon: ReactNode }[] = [
  { key: 'goal.preset.train', icon: <TrainFront aria-hidden /> },
  { key: 'goal.preset.queue', icon: <ListOrdered aria-hidden /> },
  { key: 'goal.preset.food', icon: <Utensils aria-hidden /> },
  { key: 'goal.preset.parking', icon: <CarFront aria-hidden /> },
  { key: 'goal.preset.topup', icon: <CreditCard aria-hidden /> },
];

export function GoalScreen({
  onBack,
  onSubmit,
  onSettings,
}: {
  onBack: () => void;
  onSubmit: (goal: string) => void;
  onSettings: () => void;
}) {
  const { t, settings } = useSettings();
  const [goal, setGoal] = useState('');
  const voice = useVoiceInput(
    settings.locale,
    useCallback((text: string) => setGoal(text), []),
  );
  const valid = goal.trim().length >= 2;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (valid) onSubmit(goal.trim());
  };

  return (
    <Screen label={t('goal.title')}>
      <TopBar onBack={onBack} onSettings={onSettings} />
      <h1 className="text-[1.75rem] leading-tight font-extrabold text-balance">
        {t('goal.title')}
      </h1>
      <p className="mt-2 text-ink-muted">{t('goal.subtitle')}</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {PRESETS.map(({ key, icon }) => {
          const label = t(key);
          const selected = goal === label;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              onClick={() => setGoal(label)}
              className={cn(
                'flex min-h-24 flex-col items-start gap-3 rounded-3xl p-4 text-left leading-snug font-bold ring-1 transition-colors odd:last:col-span-2',
                '[&>svg]:size-7',
                selected
                  ? 'bg-brand-500 text-white ring-brand-500'
                  : 'bg-surface text-ink ring-line [&>svg]:text-brand-500',
              )}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} className="mt-auto space-y-3 pt-8">
        <label htmlFor="goal-input" className="font-bold">
          {t('goal.label')}
        </label>
        <div className="flex gap-2">
          <input
            id="goal-input"
            value={goal}
            maxLength={MAX_GOAL_LENGTH}
            onChange={(event) => setGoal(event.target.value)}
            placeholder={voice.listening ? t('goal.listening') : t('goal.placeholder')}
            enterKeyHint="go"
            className="min-h-16 min-w-0 flex-1 rounded-2xl bg-surface px-5 text-lg ring-1 ring-line focus:ring-2 focus:ring-brand-400 focus:outline-none"
          />
          {voice.supported && (
            <IconButton
              label={voice.listening ? t('goal.listening') : t('goal.speak')}
              aria-pressed={voice.listening}
              onClick={voice.listening ? voice.stop : voice.start}
              className={cn(
                'size-16',
                voice.listening && 'animate-pulse bg-brand-500 text-white ring-0',
              )}
            >
              {voice.listening ? (
                <MicOff aria-hidden className="size-7" />
              ) : (
                <Mic aria-hidden className="size-7" />
              )}
            </IconButton>
          )}
        </div>
        <Button type="submit" disabled={!valid}>
          {t('goal.continue')}
        </Button>
      </form>
    </Screen>
  );
}
