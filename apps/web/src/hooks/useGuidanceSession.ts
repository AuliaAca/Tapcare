import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { HistoryStep, Locale, StepFeedback } from '@tapcare/shared';
import { ApiError, requestGuidance } from '../lib/api.ts';
import type { CapturedFrame } from '../lib/image.ts';
import { initialSession, sessionReducer, withFeedback } from './guidanceSession.ts';

export interface SessionOptions {
  goal: string;
  locale: Locale;
  request?: typeof requestGuidance;
}

/** Runs the agentic loop: photo → next step → user feedback → next photo. */
export function useGuidanceSession({ goal, locale, request = requestGuidance }: SessionOptions) {
  const [state, dispatch] = useReducer(sessionReducer, initialSession);
  const controllerRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (frame: CapturedFrame, history: HistoryStep[]) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      dispatch({ type: 'analyze_start', frame });
      try {
        const guidance = await request(
          { goal, locale, image: frame.image, history },
          { signal: controller.signal },
        );
        dispatch({ type: 'analyze_success', guidance });
      } catch (error) {
        const code = error instanceof ApiError ? error.code : 'INTERNAL_ERROR';
        if (code !== 'ABORTED') dispatch({ type: 'analyze_failure', code });
      }
    },
    [goal, locale, request],
  );

  const analyze = useCallback(
    (frame: CapturedFrame) => run(frame, state.history),
    [run, state.history],
  );

  const retry = useCallback(() => {
    if (state.frame) void run(state.frame, state.history);
  }, [run, state.frame, state.history]);

  const giveFeedback = useCallback(
    (feedback: StepFeedback) => {
      const history = withFeedback(state, feedback);
      dispatch({ type: 'feedback', feedback });
      if (feedback === 'cant_find' && state.frame) void run(state.frame, history);
    },
    [run, state],
  );

  const retake = useCallback(() => dispatch({ type: 'retake' }), []);
  const reset = useCallback(() => {
    controllerRef.current?.abort();
    dispatch({ type: 'reset' });
  }, []);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return { state, analyze, retry, giveFeedback, retake, reset };
}
