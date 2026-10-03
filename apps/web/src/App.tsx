import { AnimatePresence, LazyMotion, domAnimation } from 'motion/react';
import { lazy, Suspense, useState } from 'react';
import { Loader } from 'lucide-react';
import { HelpSheet, HowItWorksSheet } from './components/InfoSheets.tsx';
import { SettingsSheet } from './components/SettingsSheet.tsx';
import { useNavigation, type Route } from './hooks/useNavigation.ts';
import type { requestGuidance } from './lib/api.ts';
import { findScenario } from './practice/scenarios.ts';
import { GoalScreen } from './screens/GoalScreen.tsx';
import { HomeScreen } from './screens/HomeScreen.tsx';

// Camera and practice flows load on demand to keep the first screen fast on slow networks.
const LiveGuideScreen = lazy(() =>
  import('./screens/live/LiveGuideScreen.tsx').then((module) => ({
    default: module.LiveGuideScreen,
  })),
);
const PracticeMenuScreen = lazy(() =>
  import('./screens/PracticeMenuScreen.tsx').then((module) => ({
    default: module.PracticeMenuScreen,
  })),
);
const PracticeScreen = lazy(() =>
  import('./screens/PracticeScreen.tsx').then((module) => ({ default: module.PracticeScreen })),
);

function LoadingScreen() {
  return (
    <div role="status" aria-busy className="flex min-h-dvh items-center justify-center">
      <Loader aria-hidden className="size-10 animate-spin text-brand-500" />
    </div>
  );
}

type SheetName = 'settings' | 'how' | 'help' | null;

const routeKey = (route: Route) =>
  route.name === 'practice' ? `practice-${route.scenarioId}` : route.name;

export function App({ request }: { request?: typeof requestGuidance } = {}) {
  const { route, navigate, replace, back, home } = useNavigation();
  const [sheet, setSheet] = useState<SheetName>(null);
  const openSettings = () => setSheet('settings');

  const renderRoute = () => {
    switch (route.name) {
      case 'home':
        return (
          <HomeScreen
            onStart={() => navigate({ name: 'goal' })}
            onPractice={() => navigate({ name: 'practice-menu' })}
            onHowItWorks={() => setSheet('how')}
            onSettings={openSettings}
          />
        );
      case 'goal':
        return (
          <GoalScreen
            onBack={back}
            onSettings={openSettings}
            onSubmit={(goal) => navigate({ name: 'live', goal })}
          />
        );
      case 'live':
        return (
          <LiveGuideScreen
            goal={route.goal}
            onExit={home}
            onHelp={() => setSheet('help')}
            onSettings={openSettings}
            request={request}
          />
        );
      case 'practice-menu':
        return (
          <PracticeMenuScreen
            onBack={back}
            onSettings={openSettings}
            onPick={(scenarioId) => navigate({ name: 'practice', scenarioId })}
          />
        );
      case 'practice': {
        const scenario = findScenario(route.scenarioId);
        if (!scenario) return null;
        return (
          <PracticeScreen
            key={scenario.id}
            scenario={scenario}
            onBack={back}
            onSettings={openSettings}
            onOtherPractice={() => replace({ name: 'practice-menu' })}
            onTryLive={() => replace({ name: 'goal' })}
          />
        );
      }
    }
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <Suspense fallback={<LoadingScreen />}>
        <AnimatePresence mode="wait">
          <div key={routeKey(route)}>{renderRoute()}</div>
        </AnimatePresence>
      </Suspense>
      <SettingsSheet open={sheet === 'settings'} onClose={() => setSheet(null)} />
      <HowItWorksSheet open={sheet === 'how'} onClose={() => setSheet(null)} />
      <HelpSheet open={sheet === 'help'} onClose={() => setSheet(null)} />
    </LazyMotion>
  );
}
