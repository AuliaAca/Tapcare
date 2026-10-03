import { Pointer } from 'lucide-react';
import { m } from 'motion/react';
import type { Locale } from '@tapcare/shared';
import { cn } from '../lib/cn.ts';
import type { KioskButton, KioskScreen, KioskVisual } from './scenarios.ts';

const TONES: Record<NonNullable<KioskButton['tone']>, string> = {
  primary: 'bg-[oklch(0.5_0.17_255)] text-white',
  success: 'bg-[oklch(0.58_0.15_152)] text-white',
  neutral: 'bg-white text-slate-800 ring-1 ring-slate-300',
};

/**
 * A deliberately "kiosk-looking" screen (not TapCare's own style), so practice
 * feels like the real machines: dense header, boxy buttons, hardware bezel.
 */
export function PracticeKiosk({
  kioskName,
  screen,
  locale,
  showHint,
  shakeKey,
  onTap,
}: {
  kioskName: string;
  screen: KioskScreen;
  locale: Locale;
  showHint: boolean;
  shakeKey: number;
  onTap: (buttonId: string) => void;
}) {
  const twoColumns = screen.buttons.length >= 4;
  return (
    <div className="rounded-[2rem] bg-slate-800 p-3 shadow-2xl ring-1 ring-black/40">
      <m.div
        key={shakeKey}
        animate={shakeKey ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
        transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-[1.4rem] bg-slate-100 text-slate-900"
      >
        <div className="flex items-center justify-between bg-[oklch(0.35_0.08_255)] px-4 py-2 text-xs font-bold tracking-wide text-white">
          <span>{kioskName}</span>
          <span aria-hidden>●●● 10:24</span>
        </div>
        <div className="space-y-3 px-4 pt-5 pb-5">
          <h2 className="text-center text-xl font-extrabold">{screen.heading[locale]}</h2>
          {screen.body && (
            <p className="text-center text-sm text-slate-600">{screen.body[locale]}</p>
          )}
          {screen.amount && (
            <p className="mx-auto w-fit rounded-full bg-white px-4 py-1 text-lg font-extrabold ring-1 ring-slate-300">
              {screen.amount}
            </p>
          )}
          {screen.visual && <Visual kind={screen.visual} />}
          <div className={cn('grid gap-3 pt-1', twoColumns ? 'grid-cols-2' : 'grid-cols-1')}>
            {screen.buttons.map((button) => {
              const highlighted = showHint && button.correct;
              return (
                <button
                  key={button.id}
                  type="button"
                  onClick={() => onTap(button.id)}
                  className={cn(
                    'relative min-h-14 rounded-lg px-3 py-3 text-base font-bold shadow-sm',
                    TONES[button.tone ?? 'neutral'],
                    highlighted &&
                      'animate-pulse-ring outline-4 outline-offset-2 outline-[oklch(0.67_0.19_287)]',
                  )}
                >
                  {button.label[locale]}
                  {highlighted && (
                    <Pointer
                      aria-hidden
                      className="absolute -right-2 -bottom-3 size-8 rotate-[-20deg] fill-white text-brand-600 drop-shadow"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </m.div>
      <div aria-hidden className="mt-3 flex items-center justify-around px-6 pb-1">
        <span className="h-1.5 w-16 rounded-full bg-slate-950" />
        <span className="size-3 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400" />
        <span className="h-3 w-12 rounded-sm bg-slate-950" />
      </div>
    </div>
  );
}

function Visual({ kind }: { kind: KioskVisual }) {
  if (kind === 'qr') {
    // A decorative pattern, not a scannable code.
    const cells = Array.from(
      { length: 81 },
      (_, index) => (index * 37 + (index % 7) * 11) % 3 === 0,
    );
    return (
      <div
        aria-hidden
        className="mx-auto grid size-36 grid-cols-9 gap-0.5 rounded-xl bg-white p-3 ring-1 ring-slate-300"
      >
        {cells.map((filled, index) => (
          <span key={index} className={filled ? 'bg-slate-900' : 'bg-transparent'} />
        ))}
      </div>
    );
  }
  if (kind === 'keypad') {
    return (
      <div aria-hidden className="mx-auto grid w-44 grid-cols-3 gap-2 rounded-xl bg-slate-700 p-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '✕', '0', '✓'].map((key) => (
          <span
            key={key}
            className="flex h-9 items-center justify-center rounded-md bg-slate-500 font-bold text-white"
          >
            {key}
          </span>
        ))}
      </div>
    );
  }
  return null;
}
