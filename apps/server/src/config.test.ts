import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from './config.ts';

describe('loadConfig', () => {
  it('uses safe defaults and the mock provider when no key is set', () => {
    const config = loadConfig({});
    expect(config).toMatchObject({
      port: 8787,
      provider: 'mock',
      model: 'claude-opus-5-5',
      effort: 'low',
      trustProxy: false,
    });
    expect(config.allowedOrigins).toEqual(['http://localhost:5173', 'http://localhost:4173']);
  });

  it('picks Claude automatically when a key is present', () => {
    expect(loadConfig({ ANTHROPIC_API_KEY: 'sk-test' }).provider).toBe('claude');
  });

  it('treats a blank key as missing', () => {
    expect(loadConfig({ ANTHROPIC_API_KEY: '   ' }).anthropicApiKey).toBeUndefined();
  });

  it('refuses to start in claude mode without a key', () => {
    expect(() => loadConfig({ TAPCARE_PROVIDER: 'claude' })).toThrow(ConfigError);
  });

  it('reports invalid values readably', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/);
  });

  it('parses origins and flags', () => {
    const config = loadConfig({
      ALLOWED_ORIGINS: ' https://a.app , ,https://b.app',
      TRUST_PROXY: 'true',
    });
    expect(config.allowedOrigins).toEqual(['https://a.app', 'https://b.app']);
    expect(config.trustProxy).toBe(true);
  });
});
