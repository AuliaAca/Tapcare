import { Camera, ListChecks, RotateCcw } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { useEffect, useState } from 'react';
import companion from '../assets/companion.webp';
import { Button } from '../components/Button.tsx';
import { Celebration } from '../components/Celebration.tsx';
import { SafetyBanner } from '../components/SafetyBanner.tsx';
import { Screen } from '../components/Screen.tsx';
import { Toggle } from '../components/Segmented.tsx';
import { TopBar } from '../components/TopBar.tsx';
import { useSpeech } from '../hooks/useSpeech.ts';
import { vibrate } from '../lib/haptics.ts';
import { startPractice, tapButton } from '../practice/coach.ts';
import { PracticeKiosk } from '../practice/PracticeKiosk.tsx';
import type { Scenario } from '../practice/scenarios.ts';
import { useSettings } from '../settings/useSettings.ts';

export function PracticeScreen({
  scenario,
  onBack,
  onOtherPractice,
  onTryLive,
  onSettings,
}: {
  scenario: Scenario;
  onBack: () => void;
  onOtherPractice: () => void;
  onTryLive: () => void;
  onSettings: () => void;
}) {
  const { t, settings } = useSettings();
  const { speak } = useSpeech();
  const [state, setState] = useState(startPractice);
  const [hints, setHints] = useState(true);
  const [shakeKey, setShakeKey] = useState(0);
  const locale = settings.locale;
  const screen = scenario.screens[state.screenIndex] ?? scenario.screens[0];

  useEffect(() => {
    speak(state.finished || !screen ? scenario.finale[locale] : screen.coach[locale]);
  }, [screen, state.finished, scenario, locale, speak]);

  const onTap = (buttonId: string) => {
    const next = tapButton(scenario, state, buttonId);
    if (next.lastResult === 'wrong') {
      setShakeKey((key) => key + 1);
      if (settings.haptics) vibrate([30, 40, 30]);
      speak(t('practice.wrong'));
    }
    setState(next);
  };

  if (state.finished || !screen) {
    return (
      <Screen label={t('practice.doneTitle')}>
        <TopBar onBack={onBack} onSettings={onSettings} title={scenario.title[locale]} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <Celebration />
          <h2 className="text-3xl font-extrabold">{t('practice.doneTitle')}</h2>
          <p className="text-xl font-semibold text-balance">{scenario.finale[locale]}</p>
          <p className="text-ink-muted">{t('practice.doneBody')}</p>
        </div>
        <div className="space-y-3">
          <Button icon={<Camera aria-hidden className="size-6" />} onClick={onTryLive}>
            {t('practice.tryLive')}
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              arrangement="stacked"
              icon={<RotateCcw aria-hidden className="size-5" />}
              onClick={() => setState(startPractice())}
            >
              {t('practice.again')}
            </Button>
            <Button
              variant="secondary"
              arrangement="stacked"
              icon={<ListChecks aria-hidden className="size-5" />}
              onClick={onOtherPractice}
            >
              {t('practice.other')}
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  const safety = screen.safety
    ? {
        level: 'caution' as const,
        kind: screen.visual === 'keypad' ? ('pin_entry' as const) : ('payment' as const),
        message: screen.safety[locale],
      }
    : null;

  return (
    <Screen label={scenario.title[locale]}>
      <TopBar
        onBack={onBack}
        onSettings={onSettings}
        eyebrow={t('practice.stepOf', { n: state.screenIndex + 1, total: scenario.screens.length })}
        title={scenario.title[locale]}
      />
      <div
        className="mb-4 h-2 overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={scenario.screens.length}
        aria-valuenow={state.screenIndex}
      >
        <m.div
          className="h-full rounded-full bg-brand-500"
          animate={{ width: `${(state.screenIndex / scenario.screens.length) * 100}%` }}
        />
      </div>

      <PracticeKiosk
        kioskName={scenario.kioskName}
        screen={screen}
        locale={locale}
        showHint={hints}
        shakeKey={shakeKey}
        onTap={onTap}
      />

      <div className="mt-5 flex gap-3">
        <img src={companion} alt="" className="size-14 shrink-0 rounded-2xl shadow-md" />
        <div className="flex-1 space-y-2 rounded-3xl rounded-tl-md bg-surface p-4 shadow-md ring-1 ring-line">
          <AnimatePresence mode="wait">
            <m.p
              key={`${screen.id}-${state.mistakes}`}
              aria-live="polite"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-lg leading-snug font-bold"
            >
              {state.lastResult === 'wrong' ? t('practice.wrong') : screen.coach[locale]}
            </m.p>
          </AnimatePresence>
        </div>
      </div>
      {safety && (
        <div className="mt-3">
          <SafetyBanner safety={safety} />
        </div>
      )}
      <div className="mt-auto pt-4">
        <Toggle label={t('practice.hints')} checked={hints} onChange={setHints} />
      </div>
    </Screen>
  );
}
