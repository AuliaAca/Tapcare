import { pino } from 'pino';
import type { ParsedGuidanceRequest } from '@tapcare/shared';
import type { AppConfig } from '../src/config.ts';

export const silentLogger = pino({ level: 'silent' });

export const testConfig = (overrides: Partial<AppConfig> = {}): AppConfig => ({
  env: 'test',
  port: 0,
  provider: 'mock',
  anthropicApiKey: undefined,
  model: 'claude-opus-5-5',
  effort: 'low',
  allowedOrigins: ['http://localhost:5173'],
  rateLimitPerMinute: 100,
  trustProxy: false,
  logLevel: 'silent',
  staticDir: undefined,
  ...overrides,
});

export const sampleImage = {
  mediaType: 'image/jpeg' as const,
  data: 'A'.repeat(400),
  width: 1000,
  height: 800,
};

export const sampleRequest = (
  overrides: Partial<ParsedGuidanceRequest> = {},
): ParsedGuidanceRequest => ({
  goal: 'Beli tiket kereta',
  locale: 'id',
  image: sampleImage,
  history: [],
  ...overrides,
});
