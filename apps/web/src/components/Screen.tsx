import { m } from 'motion/react';
import type { ReactNode } from 'react';

/** Page container: phone-width column, safe-area padding, gentle enter animation. */
export function Screen({ children, label }: { children: ReactNode; label: string }) {
  return (
    <m.main
      aria-label={label}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      {children}
    </m.main>
  );
}
