import type { Locale, ParsedGuidanceRequest } from '@tapcare/shared';
import type { GuidanceProvider, ProviderGuidance } from './types.ts';

interface ScriptStep {
  instruction: Record<Locale, string>;
  summary: Record<Locale, string>;
  label: Record<Locale, string>;
  hint: Record<Locale, string>;
  box: { x: number; y: number; width: number; height: number };
  payment?: boolean;
}

/** A believable four-tap kiosk journey used for demos, tests, and offline development. */
const SCRIPT: ScriptStep[] = [
  {
    instruction: {
      id: 'Tekan tombol besar "Mulai" di tengah layar.',
      en: 'Tap the big "Start" button in the middle of the screen.',
    },
    summary: { id: 'Layar sambutan kiosk.', en: 'The kiosk welcome screen.' },
    label: { id: 'Mulai', en: 'Start' },
    hint: { id: 'tombol ungu besar, di tengah', en: 'big purple button, centre' },
    box: { x: 0.3, y: 0.52, width: 0.4, height: 0.14 },
  },
  {
    instruction: {
      id: 'Pilih menu yang sesuai dengan tujuan Anda, yaitu kotak paling atas.',
      en: 'Choose the menu that matches your goal — the top box.',
    },
    summary: { id: 'Daftar pilihan layanan.', en: 'A list of service options.' },
    label: { id: 'Pilihan pertama', en: 'First option' },
    hint: { id: 'kotak paling atas', en: 'the top box' },
    box: { x: 0.12, y: 0.28, width: 0.76, height: 0.13 },
  },
  {
    instruction: {
      id: 'Tekan "Lanjut" di pojok kanan bawah.',
      en: 'Tap "Next" in the bottom right corner.',
    },
    summary: { id: 'Ringkasan pilihan Anda.', en: 'A summary of your choice.' },
    label: { id: 'Lanjut', en: 'Next' },
    hint: { id: 'tombol hijau, kanan bawah', en: 'green button, bottom right' },
    box: { x: 0.62, y: 0.8, width: 0.3, height: 0.11 },
  },
  {
    instruction: {
      id: 'Periksa totalnya, lalu tekan "Bayar".',
      en: 'Check the total, then tap "Pay".',
    },
    summary: { id: 'Layar pembayaran.', en: 'The payment screen.' },
    label: { id: 'Bayar', en: 'Pay' },
    hint: { id: 'tombol biru, bawah tengah', en: 'blue button, bottom centre' },
    box: { x: 0.25, y: 0.78, width: 0.5, height: 0.12 },
    payment: true,
  },
];

const RETRY_PREFIX: Record<Locale, string> = {
  id: 'Coba lihat lagi pelan-pelan. ',
  en: 'Take another slow look. ',
};

export class MockProvider implements GuidanceProvider {
  readonly name = 'mock' as const;

  constructor(private readonly delayMs = 0) {}

  async analyze(request: ParsedGuidanceRequest): Promise<ProviderGuidance> {
    if (this.delayMs > 0) await new Promise((resolve) => setTimeout(resolve, this.delayMs));

    const { locale, history } = request;
    const completed = history.filter((step) => step.feedback === 'done').length;
    const step = SCRIPT[completed];

    if (!step) {
      return {
        status: 'done',
        instruction:
          locale === 'id'
            ? 'Selesai! Jangan lupa ambil tiket atau struk Anda.'
            : 'All done! Remember to take your ticket or receipt.',
        screenSummary: locale === 'id' ? 'Transaksi berhasil.' : 'The transaction succeeded.',
        target: null,
        safety: { level: 'none', kind: 'none', message: null },
        confidence: 'high',
      };
    }

    const retried = history.at(-1)?.feedback !== undefined && history.at(-1)?.feedback !== 'done';
    return {
      status: 'next_step',
      instruction: (retried ? RETRY_PREFIX[locale] : '') + step.instruction[locale],
      screenSummary: step.summary[locale],
      target: { label: step.label[locale], hint: step.hint[locale], box: step.box },
      safety: step.payment
        ? { level: 'caution', kind: 'payment', message: null }
        : { level: 'none', kind: 'none', message: null },
      confidence: retried ? 'medium' : 'high',
    };
  }
}
