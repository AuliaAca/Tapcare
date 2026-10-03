import type {
  GuidanceResponse,
  Locale,
  ParsedGuidanceRequest,
  ProviderName,
  Safety,
  SafetyKind,
} from '@tapcare/shared';
import { clampBox, cleanText } from '../lib/sanitize.ts';
import type { GuidanceProvider, ProviderGuidance } from '../providers/types.ts';

const LIMITS = { instruction: 240, summary: 240, label: 80, hint: 160, safety: 240 } as const;

/** Fallback copy so a safety banner is never empty, whatever the model returned. */
const SAFETY_DEFAULTS: Record<Locale, Record<Exclude<SafetyKind, 'none'>, string>> = {
  id: {
    pin_entry:
      'Ketik PIN sendiri dan tutupi tombol dengan tangan lain. Jangan beri tahu siapa pun.',
    payment: 'Periksa jumlah yang harus dibayar sebelum menekan tombol konfirmasi.',
    personal_data: 'Layar ini meminta data pribadi. Pastikan tidak ada yang melihat.',
    suspicious: 'Layar ini terlihat mencurigakan. Jangan lanjutkan dan minta bantuan petugas.',
  },
  en: {
    pin_entry: 'Type your PIN yourself and cover the keypad with your other hand. Never share it.',
    payment: 'Check the amount before you tap the confirm button.',
    personal_data: 'This screen asks for personal details. Make sure nobody is watching.',
    suspicious: 'This screen looks suspicious. Do not continue and ask a staff member.',
  },
};

export interface GuideContext {
  requestId: string;
  signal?: AbortSignal;
}

/**
 * Orchestrates one guidance turn: asks the provider, then enforces the output
 * contract and safety rules regardless of which provider answered.
 */
export class GuidanceService {
  constructor(
    private readonly provider: GuidanceProvider,
    private readonly now: () => number = () => performance.now(),
  ) {}

  get providerName(): ProviderName {
    return this.provider.name;
  }

  async guide(request: ParsedGuidanceRequest, context: GuideContext): Promise<GuidanceResponse> {
    const startedAt = this.now();
    const raw = await this.provider.analyze(request, context.signal);
    const guidance = postProcess(raw, request.locale);

    return {
      ...guidance,
      stepNumber: request.history.filter((step) => step.feedback === 'done').length + 1,
      meta: {
        provider: this.provider.name,
        latencyMs: Math.max(0, Math.round(this.now() - startedAt)),
        requestId: context.requestId,
      },
    };
  }
}

export function postProcess(raw: ProviderGuidance, locale: Locale): ProviderGuidance {
  const safety = enforceSafety(raw.safety, locale);
  // A "stop" verdict always hands over to a person, never to another tap.
  const status = safety.level === 'stop' ? 'needs_human' : raw.status;
  const target =
    status === 'next_step' && raw.target
      ? {
          label: cleanText(raw.target.label, LIMITS.label),
          hint: cleanText(raw.target.hint, LIMITS.hint),
          box: clampBox(raw.target.box),
        }
      : null;

  return {
    status,
    instruction: cleanText(raw.instruction, LIMITS.instruction),
    screenSummary: cleanText(raw.screenSummary, LIMITS.summary),
    target,
    safety,
    confidence: target?.box ? raw.confidence : lowerConfidence(raw.confidence, status),
  };
}

function enforceSafety(safety: Safety, locale: Locale): Safety {
  if (safety.kind === 'none') {
    return {
      level: safety.level === 'stop' ? 'stop' : 'none',
      kind: 'none',
      message: cleanMessage(safety.message),
    };
  }
  const minimumLevel = safety.kind === 'suspicious' ? 'stop' : 'caution';
  const level = safety.level === 'stop' ? 'stop' : minimumLevel;
  const message = cleanMessage(safety.message) ?? SAFETY_DEFAULTS[locale][safety.kind];
  return { level, kind: safety.kind, message };
}

function cleanMessage(message: string | null): string | null {
  if (!message) return null;
  const cleaned = cleanText(message, LIMITS.safety);
  return cleaned || null;
}

function lowerConfidence(
  confidence: ProviderGuidance['confidence'],
  status: ProviderGuidance['status'],
): ProviderGuidance['confidence'] {
  // Without a box the user relies on words alone, so never claim "high" for a tap.
  return status === 'next_step' && confidence === 'high' ? 'medium' : confidence;
}
