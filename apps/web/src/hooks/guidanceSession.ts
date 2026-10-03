import {
  MAX_HISTORY_STEPS,
  type GuidanceResponse,
  type HistoryStep,
  type StepFeedback,
} from '@tapcare/shared';
import type { ClientErrorCode } from '../lib/api.ts';
import type { CapturedFrame } from '../lib/image.ts';

export type SessionPhase = 'aiming' | 'analyzing' | 'guiding' | 'done' | 'error';

export interface SessionState {
  phase: SessionPhase;
  frame: CapturedFrame | null;
  guidance: GuidanceResponse | null;
  history: HistoryStep[];
  errorCode: ClientErrorCode | null;
}

export type SessionAction =
  | { type: 'analyze_start'; frame: CapturedFrame }
  | { type: 'analyze_success'; guidance: GuidanceResponse }
  | { type: 'analyze_failure'; code: ClientErrorCode }
  | { type: 'feedback'; feedback: StepFeedback }
  | { type: 'retake' }
  | { type: 'reset' };

export const initialSession: SessionState = {
  phase: 'aiming',
  frame: null,
  guidance: null,
  history: [],
  errorCode: null,
};

/** Records how the current step went, so the agent can verify progress or re-plan. */
export function withFeedback(state: SessionState, feedback: StepFeedback): HistoryStep[] {
  const guidance = state.guidance;
  if (!guidance || guidance.status !== 'next_step') return state.history;
  return [...state.history, { instruction: guidance.instruction, feedback }].slice(
    -MAX_HISTORY_STEPS,
  );
}

/** Pure state machine for one live guidance session. */
export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'analyze_start':
      return { ...state, phase: 'analyzing', frame: action.frame, errorCode: null };
    case 'analyze_success':
      return {
        ...state,
        phase: action.guidance.status === 'done' ? 'done' : 'guiding',
        guidance: action.guidance,
      };
    case 'analyze_failure':
      return { ...state, phase: 'error', errorCode: action.code };
    case 'feedback':
      return {
        ...state,
        history: withFeedback(state, action.feedback),
        // "Can't find" re-asks about the same photo; anything else needs a fresh photo.
        phase: action.feedback === 'cant_find' ? state.phase : 'aiming',
      };
    case 'retake':
      return { ...state, phase: 'aiming', errorCode: null };
    case 'reset':
      return initialSession;
  }
}

/** Number of steps the user completed, for the success screen. */
export const completedSteps = (state: SessionState) =>
  state.history.filter((step) => step.feedback === 'done').length;
