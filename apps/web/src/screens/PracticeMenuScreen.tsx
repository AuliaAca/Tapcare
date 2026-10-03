import { ChevronRight, ListOrdered, TrainFront, Utensils } from 'lucide-react';
import { Screen } from '../components/Screen.tsx';
import { TopBar } from '../components/TopBar.tsx';
import { SCENARIOS, type Scenario } from '../practice/scenarios.ts';
import { useSettings } from '../settings/useSettings.ts';

const ICONS: Record<Scenario['icon'], typeof TrainFront> = {
  train: TrainFront,
  queue: ListOrdered,
  food: Utensils,
};

export function PracticeMenuScreen({
  onBack,
  onPick,
  onSettings,
}: {
  onBack: () => void;
  onPick: (scenarioId: string) => void;
  onSettings: () => void;
}) {
  const { t, settings } = useSettings();
  return (
    <Screen label={t('practice.title')}>
      <TopBar onBack={onBack} onSettings={onSettings} title={t('practice.title')} />
      <p className="text-lg text-ink-muted">{t('practice.subtitle')}</p>
      <ul className="mt-6 space-y-3">
        {SCENARIOS.map((scenario) => {
          const Icon = ICONS[scenario.icon];
          return (
            <li key={scenario.id}>
              <button
                type="button"
                onClick={() => onPick(scenario.id)}
                className="flex min-h-20 w-full items-center gap-4 rounded-3xl bg-surface p-4 text-left ring-1 ring-line transition-colors hover:bg-surface-muted"
              >
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-700/30 dark:text-brand-200">
                  <Icon aria-hidden className="size-7" />
                </span>
                <span className="flex-1">
                  <span className="block text-lg font-extrabold">
                    {scenario.title[settings.locale]}
                  </span>
                  <span className="block text-sm text-ink-muted">
                    {t('practice.stepCount', { n: scenario.screens.length })}
                  </span>
                </span>
                <ChevronRight aria-hidden className="size-6 text-ink-muted" />
              </button>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
