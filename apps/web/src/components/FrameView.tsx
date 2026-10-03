import { m, AnimatePresence } from 'motion/react';
import type { BoundingBox } from '@tapcare/shared';
import { cn } from '../lib/cn.ts';
import { highlightRect } from '../lib/geometry.ts';

const pct = (value: number) => `${(value * 100).toFixed(2)}%`;

/**
 * Shows a captured frame at its natural aspect ratio. Because the overlay shares
 * the image's box, normalised coordinates map straight to CSS percentages.
 */
export function FrameView({
  src,
  alt,
  target,
  scanning = false,
  dimmed = false,
}: {
  src: string;
  alt: string;
  target?: BoundingBox | null;
  scanning?: boolean;
  dimmed?: boolean;
}) {
  const rect = target ? highlightRect(target) : null;
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-black shadow-xl ring-1 ring-line">
      <img
        src={src}
        alt={alt}
        className={cn(
          'block h-auto w-full transition-opacity',
          (dimmed || scanning) && 'opacity-70',
        )}
      />
      {rect && (
        <>
          {/* Spotlight: darken everything except the target. */}
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-2xl"
            style={{
              left: pct(rect.x),
              top: pct(rect.y),
              width: pct(rect.width),
              height: pct(rect.height),
              boxShadow: '0 0 0 9999px oklch(0.15 0.03 285 / 0.55)',
            }}
          />
          <m.div
            data-testid="target-highlight"
            aria-hidden
            initial={{ opacity: 0, scale: 1.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="pointer-events-none absolute animate-pulse-ring rounded-2xl border-4 border-brand-400"
            style={{
              left: pct(rect.x),
              top: pct(rect.y),
              width: pct(rect.width),
              height: pct(rect.height),
            }}
          />
        </>
      )}
      <AnimatePresence>
        {scanning && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-1 animate-scan bg-gradient-to-r from-transparent via-brand-200 to-transparent shadow-[0_0_24px_6px_oklch(0.67_0.19_287/0.6)]"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
