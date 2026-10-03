import { Camera, CircleHelp, GraduationCap, ShieldCheck } from 'lucide-react';
import { m } from 'motion/react';
import companion from '../assets/companion.webp';
import { Button } from '../components/Button.tsx';
import { Screen } from '../components/Screen.tsx';
import { TopBar } from '../components/TopBar.tsx';
import { useSettings } from '../settings/useSettings.ts';

export function HomeScreen({
  onStart,
  onPractice,
  onHowItWorks,
  onSettings,
}: {
  onStart: () => void;
  onPractice: () => void;
  onHowItWorks: () => void;
  onSettings: () => void;
}) {
  const { t } = useSettings();
  return (
    <Screen label={t('app.name')}>
      <TopBar
        eyebrow={t('app.name')}
        title={undefined}
        onSettings={onSettings}
        trailing={<span className="sr-only">{t('app.tagline')}</span>}
      />

      <section className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative mb-8">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 scale-125 rounded-full bg-[radial-gradient(circle,var(--color-brand-200),transparent_65%)] opacity-70 blur-2xl"
          />
          <m.img
            src={companion}
            alt=""
            width={176}
            height={176}
            className="size-44 rounded-[2.5rem] shadow-2xl shadow-brand-500/25"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <p className="text-2xl font-extrabold text-brand-500">{t('home.greeting')}</p>
        <h1 className="mt-2 text-[2rem] leading-tight font-extrabold text-balance">
          {t('home.title')}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-pretty text-ink-muted">
          {t('home.subtitle')}
        </p>
      </section>

      <div className="mt-8 space-y-3">
        <Button icon={<Camera aria-hidden className="size-6" />} onClick={onStart}>
          {t('home.start')}
        </Button>
        <Button
          variant="secondary"
          icon={<GraduationCap aria-hidden className="size-6 text-brand-500" />}
          onClick={onPractice}
          aria-describedby="practice-hint"
        >
          {t('home.practice')}
        </Button>
        <p id="practice-hint" className="text-center text-sm text-ink-muted">
          {t('home.practiceHint')}
        </p>
        <Button
          variant="ghost"
          size="md"
          icon={<CircleHelp aria-hidden className="size-5" />}
          onClick={onHowItWorks}
        >
          {t('home.howItWorks')}
        </Button>
        <p className="flex items-center justify-center gap-2 pt-2 text-center text-sm text-ink-muted">
          <ShieldCheck aria-hidden className="size-4 shrink-0 text-success-500" />
          {t('home.privacy')}
        </p>
      </div>
    </Screen>
  );
}
