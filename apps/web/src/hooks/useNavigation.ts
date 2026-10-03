import { useCallback, useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'goal' }
  | { name: 'live'; goal: string }
  | { name: 'practice-menu' }
  | { name: 'practice'; scenarioId: string };

const HOME: Route = { name: 'home' };

function isRoute(value: unknown): value is Route {
  return typeof value === 'object' && value !== null && 'name' in value;
}

/**
 * In-memory routing that cooperates with the browser history, so the phone's
 * Back button/gesture moves back one screen instead of leaving the app.
 */
export function useNavigation() {
  const [route, setRoute] = useState<Route>(() =>
    isRoute(window.history.state) ? window.history.state : HOME,
  );

  useEffect(() => {
    if (!isRoute(window.history.state)) window.history.replaceState(HOME, '');
    const onPop = (event: PopStateEvent) => setRoute(isRoute(event.state) ? event.state : HOME);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.history.pushState(next, '');
    setRoute(next);
    window.scrollTo({ top: 0 });
  }, []);

  /** Replaces the current entry, e.g. jumping from a finished practice to the live flow. */
  const replace = useCallback((next: Route) => {
    window.history.replaceState(next, '');
    setRoute(next);
  }, []);

  const back = useCallback(() => {
    if (
      window.history.length > 1 &&
      isRoute(window.history.state) &&
      window.history.state.name !== 'home'
    ) {
      window.history.back();
    } else {
      replace(HOME);
    }
  }, [replace]);

  const home = useCallback(() => replace(HOME), [replace]);

  return { route, navigate, replace, back, home };
}
