import Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it, vi } from 'vitest';
import { sampleImage, sampleRequest, silentLogger } from '../../test/helpers.ts';
import { AppError, UpstreamRefusedError, UpstreamUnavailableError } from '../errors.ts';
import {
  ClaudeProvider,
  createAnthropicVisionClient,
  supportsServerFallback,
  toProviderGuidance,
  type ModelGuidance,
  type VisionModelClient,
} from './claude-provider.ts';

const modelOutput = (overrides: Partial<ModelGuidance> = {}): ModelGuidance => ({
  status: 'next_step',
  screen_summary: 'Layar utama',
  instruction: 'Tekan "Beli Tiket".',
  target_label: 'Beli Tiket',
  target_hint: 'tombol hijau, kiri atas',
  target_box: { x: 100, y: 80, width: 200, height: 160 },
  safety_level: 'none',
  safety_kind: 'none',
  safety_message: null,
  confidence: 'high',
  ...overrides,
});

const clientReturning = (result: Awaited<ReturnType<VisionModelClient['requestGuidance']>>) => ({
  requestGuidance: vi.fn().mockResolvedValue(result),
});

const clientThrowing = (error: unknown): VisionModelClient => ({
  requestGuidance: vi.fn().mockRejectedValue(error),
});

const headers = new Headers();

describe('ClaudeProvider', () => {
  it('sends the prompt and frame, and normalises the pixel box', async () => {
    const client = clientReturning({ stopReason: 'end_turn', output: modelOutput() });
    const provider = new ClaudeProvider(client, silentLogger);

    const result = await provider.analyze(sampleRequest());

    expect(client.requestGuidance).toHaveBeenCalledWith(
      expect.objectContaining({ image: sampleImage, userText: expect.stringContaining('<goal>') }),
    );
    expect(result.target).toEqual({
      label: 'Beli Tiket',
      hint: 'tombol hijau, kiri atas',
      box: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
    });
  });

  it('raises a refusal error when the model declines', async () => {
    const provider = new ClaudeProvider(
      clientReturning({ stopReason: 'refusal', output: null }),
      silentLogger,
    );
    await expect(provider.analyze(sampleRequest())).rejects.toBeInstanceOf(UpstreamRefusedError);
  });

  it('raises a retryable error when the output cannot be parsed', async () => {
    const provider = new ClaudeProvider(
      clientReturning({ stopReason: 'max_tokens', output: null }),
      silentLogger,
    );
    await expect(provider.analyze(sampleRequest())).rejects.toBeInstanceOf(
      UpstreamUnavailableError,
    );
  });

  it.each([
    ['rate limit', new Anthropic.RateLimitError(429, {}, 'slow down', headers), 503],
    ['connection', new Anthropic.APIConnectionError({ message: 'offline' }), 503],
    ['server error', new Anthropic.InternalServerError(500, {}, 'boom', headers), 503],
    ['bad request', new Anthropic.BadRequestError(400, {}, 'bad', headers), 500],
    ['unknown', new Error('weird'), 500],
  ])('maps %s errors to status %i', async (_name, error, status) => {
    const provider = new ClaudeProvider(clientThrowing(error), silentLogger);
    const failure = await provider.analyze(sampleRequest()).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(AppError);
    expect((failure as AppError).status).toBe(status);
  });

  it('passes through errors that are already AppErrors', async () => {
    const original = new UpstreamRefusedError();
    const provider = new ClaudeProvider(clientThrowing(original), silentLogger);
    await expect(provider.analyze(sampleRequest())).rejects.toBe(original);
  });
});

describe('toProviderGuidance', () => {
  it('drops the target when the status is not a tap', () => {
    const result = toProviderGuidance(modelOutput({ status: 'need_better_view' }), sampleImage);
    expect(result.target).toBeNull();
  });

  it('keeps a label-only target when no box is given', () => {
    const result = toProviderGuidance(
      modelOutput({ target_box: null, target_hint: null }),
      sampleImage,
    );
    expect(result.target).toEqual({ label: 'Beli Tiket', hint: '', box: null });
  });
});

describe('createAnthropicVisionClient', () => {
  const stubAnthropic = (parse: ReturnType<typeof vi.fn>) =>
    ({ beta: { messages: { parse } } }) as unknown as Anthropic;

  it('builds a structured-output vision request with refusal fallback', async () => {
    const parse = vi
      .fn()
      .mockResolvedValue({ stop_reason: 'end_turn', parsed_output: modelOutput() });
    const client = createAnthropicVisionClient(stubAnthropic(parse), {
      model: 'claude-opus-5-5',
      effort: 'low',
    });

    const result = await client.requestGuidance({
      system: 'sys',
      userText: 'hi',
      image: sampleImage,
    });

    expect(result).toEqual({ stopReason: 'end_turn', output: modelOutput() });
    const [params, options] = parse.mock.calls[0]!;
    expect(params).toMatchObject({
      model: 'claude-opus-5-5',
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: 'sys', cache_control: { type: 'ephemeral' } }],
    });
    expect(params.messages[0].content[0]).toEqual({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: sampleImage.data },
    });
    expect(options).toMatchObject({ timeout: 45_000 });
  });

  it('omits the fallback for models that do not support it', async () => {
    const parse = vi.fn().mockResolvedValue({ stop_reason: 'end_turn', parsed_output: null });
    const client = createAnthropicVisionClient(stubAnthropic(parse), {
      model: 'claude-haiku-4-5',
      effort: 'low',
    });
    await client.requestGuidance({ system: 's', userText: 'u', image: sampleImage });
    expect(parse.mock.calls[0]![0]).not.toHaveProperty('fallbacks');
  });

  it('knows which models support server-side fallback', () => {
    expect(supportsServerFallback('claude-opus-5-5')).toBe(true);
    expect(supportsServerFallback('claude-sonnet-5-5')).toBe(true);
    expect(supportsServerFallback('claude-haiku-4-5')).toBe(false);
  });
});
