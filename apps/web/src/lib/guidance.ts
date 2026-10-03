import type { GuidanceResponse } from '@tapcare/shared';
import type { MessageKey } from '../i18n/translate.ts';
import type { ClientErrorCode } from './api.ts';

/** What gets read aloud: the instruction plus any safety warning. */
export const spokenText = (guidance: GuidanceResponse) =>
  [guidance.instruction, guidance.safety.message].filter(Boolean).join(' ');

const ERROR_MESSAGES: Partial<Record<ClientErrorCode, MessageKey>> = {
  NETWORK: 'error.network',
  TIMEOUT: 'error.timeout',
  RATE_LIMITED: 'error.busy',
  UPSTREAM_UNAVAILABLE: 'error.busy',
  PAYLOAD_TOO_LARGE: 'error.tooLarge',
  UPSTREAM_REFUSED: 'error.refused',
};

/** Maps a technical error code to a plain-language message the user can act on. */
export const errorMessageKey = (code: ClientErrorCode | null): MessageKey =>
  (code && ERROR_MESSAGES[code]) || 'error.generic';
