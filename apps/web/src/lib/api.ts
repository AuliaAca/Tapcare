import {
  ApiErrorBodySchema,
  GuidanceResponseSchema,
  type GuidanceRequest,
  type GuidanceResponse,
} from '@tapcare/shared';

export type ClientErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'BAD_RESPONSE'
  | 'VALIDATION_ERROR'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'UPSTREAM_UNAVAILABLE'
  | 'UPSTREAM_REFUSED'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export class ApiError extends Error {
  override name = 'ApiError';
  constructor(
    readonly code: ClientErrorCode,
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const REQUEST_TIMEOUT_MS = 60_000;

export interface RequestOptions {
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export async function requestGuidance(
  body: GuidanceRequest,
  { signal, fetchImpl = fetch, timeoutMs = REQUEST_TIMEOUT_MS }: RequestOptions = {},
): Promise<GuidanceResponse> {
  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetchImpl(`${API_BASE}/api/guidance`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: combined,
    });
  } catch (error) {
    throw transportError(error, { cancelled: signal?.aborted, timedOut: timeout.aborted });
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw httpError(payload, response.status);

  // Validate even successful responses: the UI must never render a half-formed instruction.
  const parsed = GuidanceResponseSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError('BAD_RESPONSE', 'Response did not match the contract');
  return parsed.data;
}

function transportError(
  error: unknown,
  { cancelled, timedOut }: { cancelled?: boolean; timedOut: boolean },
): ApiError {
  if (cancelled) return new ApiError('ABORTED', 'Request was cancelled');
  if (timedOut) return new ApiError('TIMEOUT', 'Request timed out');
  return new ApiError('NETWORK', error instanceof Error ? error.message : 'Network error');
}

function httpError(payload: unknown, status: number): ApiError {
  const parsed = ApiErrorBodySchema.safeParse(payload);
  return parsed.success
    ? new ApiError(parsed.data.error.code, parsed.data.error.message, status)
    : new ApiError('BAD_RESPONSE', `Unexpected ${status} response`, status);
}
