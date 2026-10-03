import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import {
  GuidanceStatusSchema,
  SafetyKindSchema,
  type ImageInput,
  type ParsedGuidanceRequest,
} from '@tapcare/shared';
import type { Effort } from '../config.ts';
import { AppError, UpstreamRefusedError, UpstreamUnavailableError } from '../errors.ts';
import type { Logger } from '../logger.ts';
import { normalizeBox } from '../lib/sanitize.ts';
import { SYSTEM_PROMPT, buildUserText } from './prompt.ts';
import type { GuidanceProvider, ProviderGuidance } from './types.ts';

/**
 * The shape the model fills in. Flat and constraint-free so it maps cleanly to a
 * structured-output JSON schema; range checks and clamping happen in our own code.
 */
export const ModelGuidanceSchema = z.object({
  status: GuidanceStatusSchema,
  screen_summary: z.string(),
  instruction: z.string(),
  target_label: z.string().nullable(),
  target_hint: z.string().nullable(),
  target_box: z
    .object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() })
    .nullable(),
  safety_level: z.enum(['none', 'caution', 'stop']),
  safety_kind: SafetyKindSchema,
  safety_message: z.string().nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
});
export type ModelGuidance = z.infer<typeof ModelGuidanceSchema>;

export interface VisionRequest {
  system: string;
  userText: string;
  image: ImageInput;
  signal?: AbortSignal;
}

export interface VisionResult {
  stopReason: string | null;
  output: ModelGuidance | null;
}

/** Port for the model call, so the provider can be tested without the network. */
export interface VisionModelClient {
  requestGuidance(request: VisionRequest): Promise<VisionResult>;
}

const REQUEST_TIMEOUT_MS = 45_000;

/** Models that accept the server-side refusal fallback (`fallbacks: "default"`). */
const FALLBACK_MODEL_PREFIXES = ['claude-opus-5', 'claude-fable-5', 'claude-sonnet-5-5'];
export const supportsServerFallback = (model: string) =>
  FALLBACK_MODEL_PREFIXES.some((prefix) => model.startsWith(prefix));

/** Adapter from the Anthropic SDK to the VisionModelClient port. */
export function createAnthropicVisionClient(
  anthropic: Anthropic,
  options: { model: string; effort: Effort },
): VisionModelClient {
  const fallback = supportsServerFallback(options.model)
    ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }
    : {};

  return {
    async requestGuidance({ system, userText, image, signal }) {
      const response = await anthropic.beta.messages.parse(
        {
          model: options.model,
          max_tokens: 16_000,
          ...fallback,
          output_config: {
            effort: options.effort,
            format: betaZodOutputFormat(ModelGuidanceSchema),
          },
          system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: image.mediaType, data: image.data },
                },
                { type: 'text', text: userText },
              ],
            },
          ],
        },
        { signal, timeout: REQUEST_TIMEOUT_MS },
      );
      return { stopReason: response.stop_reason, output: response.parsed_output };
    },
  };
}

export class ClaudeProvider implements GuidanceProvider {
  readonly name = 'claude' as const;

  constructor(
    private readonly client: VisionModelClient,
    private readonly logger: Logger,
  ) {}

  async analyze(request: ParsedGuidanceRequest, signal?: AbortSignal): Promise<ProviderGuidance> {
    let result: VisionResult;
    try {
      result = await this.client.requestGuidance({
        system: SYSTEM_PROMPT,
        userText: buildUserText(request),
        image: request.image,
        signal,
      });
    } catch (error) {
      throw this.mapError(error);
    }

    if (result.stopReason === 'refusal') throw new UpstreamRefusedError();
    if (!result.output) {
      this.logger.warn({ stopReason: result.stopReason }, 'model returned no parsable guidance');
      throw new UpstreamUnavailableError(
        'I could not read the screen this time. Please try again.',
      );
    }
    return toProviderGuidance(result.output, request.image);
  }

  private mapError(error: unknown): AppError {
    if (error instanceof AppError) return error;
    if (error instanceof Anthropic.RateLimitError) {
      this.logger.warn({ status: error.status }, 'anthropic rate limit');
      return new UpstreamUnavailableError('TapCare is busy right now. Please try again shortly.', {
        cause: error,
      });
    }
    if (error instanceof Anthropic.APIConnectionError) {
      // Also covers APIConnectionTimeoutError and aborted requests.
      this.logger.warn({ err: error }, 'anthropic connection error');
      return new UpstreamUnavailableError('Connection problem. Please try again.', {
        cause: error,
      });
    }
    if (error instanceof Anthropic.APIError && (error.status ?? 0) >= 500) {
      this.logger.warn({ status: error.status }, 'anthropic server error');
      return new UpstreamUnavailableError('TapCare is busy right now. Please try again shortly.', {
        cause: error,
      });
    }
    // 4xx from the API means our request or credentials are wrong: an operator problem, not a user one.
    this.logger.error({ err: error }, 'unexpected model client error');
    return new AppError('INTERNAL_ERROR', 'Something went wrong on our side.', 500, {
      cause: error,
    });
  }
}

export function toProviderGuidance(output: ModelGuidance, frame: ImageInput): ProviderGuidance {
  const box = output.target_box ? normalizeBox(output.target_box, frame) : null;
  const hasTarget = output.status === 'next_step' && (output.target_label || box);

  return {
    status: output.status,
    instruction: output.instruction,
    screenSummary: output.screen_summary,
    target: hasTarget
      ? { label: output.target_label ?? '', hint: output.target_hint ?? '', box }
      : null,
    safety: {
      level: output.safety_level,
      kind: output.safety_kind,
      message: output.safety_message,
    },
    confidence: output.confidence,
  };
}
