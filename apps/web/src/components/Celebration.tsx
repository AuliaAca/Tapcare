import { Check } from 'lucide-react';
import { m } from 'motion/react';

const DOTS = Array.from({ length: 10 }, (_, index) => index);

/** A calm success moment: a check mark with a soft burst, no sound, no flashing. */
export function Celebration() {
  return (
    <div className="relative mx-auto flex size-40 items-center justify-center" aria-hidden>
      {DOTS.map((index) => {
        const angle = (index / DOTS.length) * Math.PI * 2;
        return (
          <m.span
            key={index}
            className="absolute size-3 rounded-full"
            style={{
              background: index % 2 ? 'var(--color-brand-400)' : 'var(--color-success-500)',
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{
              x: Math.cos(angle) * 72,
              y: Math.sin(angle) * 72,
              opacity: [0, 1, 0],
              scale: 1,
            }}
            transition={{ duration: 1.1, delay: 0.15, ease: 'easeOut' }}
          />
        );
      })}
      <m.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14 }}
        className="flex size-28 items-center justify-center rounded-full bg-success-500 text-white shadow-2xl shadow-success-500/40"
      >
        <Check className="size-16" strokeWidth={3} />
      </m.div>
    </div>
  );
}
