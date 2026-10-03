import Anthropic from '@anthropic-ai/sdk';
import type { AppConfig } from '../config.ts';
import type { Logger } from '../logger.ts';
import { ClaudeProvider, createAnthropicVisionClient } from './claude-provider.ts';
import { MockProvider } from './mock-provider.ts';
import type { GuidanceProvider } from './types.ts';

export function createProvider(config: AppConfig, logger: Logger): GuidanceProvider {
  if (config.provider === 'claude') {
    const anthropic = new Anthropic({ apiKey: config.anthropicApiKey, maxRetries: 1 });
    const client = createAnthropicVisionClient(anthropic, {
      model: config.model,
      effort: config.effort,
    });
    return new ClaudeProvider(client, logger.child({ provider: 'claude' }));
  }
  // A short delay makes the demo feel like the real thing without slowing tests (which use 0).
  return new MockProvider(config.env === 'test' ? 0 : 900);
}
