import { describe, expect, it } from 'vitest';
import { startPractice, tapButton } from './coach.ts';
import { findScenario, SCENARIOS } from './scenarios.ts';

describe('scenarios', () => {
  it.each(SCENARIOS.map((scenario) => [scenario.id, scenario] as const))(
    '%s has exactly one correct button per screen and unique ids',
    (_id, scenario) => {
      const screenIds = scenario.screens.map((screen) => screen.id);
      expect(new Set(screenIds).size).toBe(screenIds.length);
      for (const screen of scenario.screens) {
        expect(screen.buttons.filter((button) => button.correct)).toHaveLength(1);
        const buttonIds = screen.buttons.map((button) => button.id);
        expect(new Set(buttonIds).size).toBe(buttonIds.length);
      }
    },
  );

  it('teaches PIN safety in the food scenario', () => {
    const pin = findScenario('food-order')?.screens.find((screen) => screen.visual === 'keypad');
    expect(pin?.safety?.id).toMatch(/PIN/);
  });

  it('returns undefined for unknown scenarios', () => {
    expect(findScenario('nope')).toBeUndefined();
  });
});

describe('tapButton', () => {
  const scenario = findScenario('queue-number')!;

  it('counts a mistake without advancing on a wrong tap', () => {
    const state = tapButton(scenario, { ...startPractice(), screenIndex: 1 }, 'dental');
    expect(state).toMatchObject({ screenIndex: 1, mistakes: 1, lastResult: 'wrong' });
  });

  it('advances on the correct tap and finishes after the last screen', () => {
    let state = startPractice();
    state = tapButton(scenario, state, 'start');
    state = tapButton(scenario, state, 'general');
    expect(state).toMatchObject({ screenIndex: 2, lastResult: 'correct', finished: false });
    state = tapButton(scenario, state, 'print');
    expect(state.finished).toBe(true);
    expect(tapButton(scenario, state, 'print')).toBe(state);
  });

  it('treats an out-of-range screen as finished', () => {
    expect(tapButton(scenario, { ...startPractice(), screenIndex: 99 }, 'x').finished).toBe(true);
  });
});
