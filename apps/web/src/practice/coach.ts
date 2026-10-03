import type { Scenario } from './scenarios.ts';

export interface PracticeState {
  screenIndex: number;
  mistakes: number;
  lastResult: 'correct' | 'wrong' | null;
  finished: boolean;
}

export const startPractice = (): PracticeState => ({
  screenIndex: 0,
  mistakes: 0,
  lastResult: null,
  finished: false,
});

/** Pure step evaluation: advances on the correct button, counts a gentle mistake otherwise. */
export function tapButton(
  scenario: Scenario,
  state: PracticeState,
  buttonId: string,
): PracticeState {
  if (state.finished) return state;
  const screen = scenario.screens[state.screenIndex];
  if (!screen) return { ...state, finished: true };

  const button = screen.buttons.find((candidate) => candidate.id === buttonId);
  if (!button?.correct) {
    return { ...state, mistakes: state.mistakes + 1, lastResult: 'wrong' };
  }
  const nextIndex = state.screenIndex + 1;
  return {
    ...state,
    screenIndex: Math.min(nextIndex, scenario.screens.length - 1),
    lastResult: 'correct',
    finished: nextIndex >= scenario.screens.length,
  };
}
