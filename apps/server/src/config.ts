import { z } from 'zod';
import type { ProviderName } from '@tapcare/shared';

const optionalTrimmed = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : undefined));

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(8787),
  TAPCARE_PROVIDER: z.enum(['auto', 'claude', 'mock']).default('auto'),
  ANTHROPIC_API_KEY: optionalTrimmed,
  TAPCARE_MODEL: z.string().trim().min(1).default('claude-opus-5-5'),
  TAPCARE_EFFORT: z.enum(['low', 'medium', 'high']).default('low'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://localhost:4173'),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).max(1_000).default(20),
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  STATIC_DIR: optionalTrimmed,
});

export type Effort = 'low' | 'medium' | 'high';

export interface AppConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  provider: ProviderName;
  anthropicApiKey: string | undefined;
  model: string;
  effort: Effort;
  allowedOrigins: string[];
  rateLimitPerMinute: number;
  trustProxy: boolean;
  logLevel: string;
  staticDir: string | undefined;
}

export class ConfigError extends Error {
  override name = 'ConfigError';
}

/**
 * Reads and validates environment variables once at startup.
 * Fails fast with a readable message instead of crashing later on a bad value.
 */
export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new ConfigError(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
  }
  const e = parsed.data;

  if (e.TAPCARE_PROVIDER === 'claude' && !e.ANTHROPIC_API_KEY) {
    throw new ConfigError('TAPCARE_PROVIDER=claude requires ANTHROPIC_API_KEY to be set.');
  }
  const provider: ProviderName =
    e.TAPCARE_PROVIDER === 'auto' ? (e.ANTHROPIC_API_KEY ? 'claude' : 'mock') : e.TAPCARE_PROVIDER;

  return {
    env: e.NODE_ENV,
    port: e.PORT,
    provider,
    anthropicApiKey: e.ANTHROPIC_API_KEY,
    model: e.TAPCARE_MODEL,
    effort: e.TAPCARE_EFFORT,
    allowedOrigins: e.ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    rateLimitPerMinute: e.RATE_LIMIT_PER_MINUTE,
    trustProxy: e.TRUST_PROXY,
    logLevel: e.LOG_LEVEL,
    staticDir: e.STATIC_DIR,
  };
}
