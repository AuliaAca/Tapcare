import { describe, expect, it } from 'vitest';
import { MAX_HISTORY_STEPS } from '@tapcare/shared';
import { guidance } from '../../test/render.tsx';
import type { CapturedFrame } from '../lib/image.ts';
import {
  completedSteps,
  initialSession,
  sessionReducer,
  withFeedback,
  type SessionState,
} from './guidanceSession.ts';

const frame: CapturedFrame = {
  previewUrl: 'data:image/jpeg;base64,AAAA',
  image: { mediaType: 'image/jpeg', data: 'AAAA', width: 640, height: 480 },
};

const guiding = (overrides: Partial<SessionState> = {}): SessionState => ({
  ...initialSession,
  phase: 'guiding',
  frame,
  guidance: guidance(),
  ...overrides,
});

describe('sessionReducer', () => {
  it('moves through analyse → guide', () => {
    const analyzing = sessionReducer(initialSession, { type: 'analyze_start', frame });
    expect(analyzing).toMatchObject({ phase: 'analyzing', frame });
    const next = sessionReducer(analyzing, { type: 'analyze_success', guidance: guidance() });
    expect(next.phase).toBe('guiding');
  });

  it('finishes when the goal is complete', () => {
    const state = sessionReducer(initialSession, {
      type: 'analyze_success',
      guidance: guidance({ status: 'done', target: null }),
    });
    expect(state.phase).toBe('done');
  });

  it('records failures', () => {
    expect(
      sessionReducer(initialSession, { type: 'analyze_failure', code: 'NETWORK' }),
    ).toMatchObject({
      phase: 'error',
      errorCode: 'NETWORK',
    });
  });

  it('logs completed steps and asks for a new photo', () => {
    const state = sessionReducer(guiding(), { type: 'feedback', feedback: 'done' });
    expect(state.phase).toBe('aiming');
    expect(state.history).toEqual([{ instruction: 'Tekan "Beli Tiket".', feedback: 'done' }]);
    expect(completedSteps(state)).toBe(1);
  });

  it('keeps the photo when the user cannot find the button', () => {
    const state = sessionReducer(guiding(), { type: 'feedback', feedback: 'cant_find' });
    expect(state.phase).toBe('guiding');
    expect(state.history.at(-1)?.feedback).toBe('cant_find');
  });

  it('does not log feedback for non-tap guidance', () => {
    const state = guiding({ guidance: guidance({ status: 'need_better_view', target: null }) });
    expect(withFeedback(state, 'done')).toEqual([]);
  });

  it('caps history length', () => {
    const history = Array.from({ length: MAX_HISTORY_STEPS }, () => ({
      instruction: 'x',
      feedback: 'done' as const,
    }));
    expect(withFeedback(guiding({ history }), 'done')).toHaveLength(MAX_HISTORY_STEPS);
  });

  it('retakes and resets', () => {
    expect(
      sessionReducer(guiding({ phase: 'error', errorCode: 'TIMEOUT' }), { type: 'retake' }),
    ).toMatchObject({
      phase: 'aiming',
      errorCode: null,
    });
    expect(sessionReducer(guiding(), { type: 'reset' })).toEqual(initialSession);
  });
});
