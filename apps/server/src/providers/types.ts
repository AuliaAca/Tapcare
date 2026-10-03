import type { GuidanceResponse, ParsedGuidanceRequest, ProviderName } from '@tapcare/shared';

/** What a provider returns before the service adds step numbering and request metadata. */
export type ProviderGuidance = Omit<GuidanceResponse, 'meta' | 'stepNumber'>;

/**
 * Any engine that can look at a kiosk frame and decide the next tap.
 * The service depends on this abstraction, so providers can be swapped without touching routes.
 */
export interface GuidanceProvider {
  readonly name: ProviderName;
  analyze(request: ParsedGuidanceRequest, signal?: AbortSignal): Promise<ProviderGuidance>;
}
