import { m, type HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn.ts';
import { vibrate } from '../lib/haptics.ts';
import { useSettings } from '../settings/useSettings.ts';

type Variant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 active:bg-brand-700',
  secondary: 'bg-surface text-ink ring-1 ring-line hover:bg-surface-muted',
  ghost: 'bg-transparent text-ink-muted hover:bg-surface-muted',
  success: 'bg-success-500 text-white shadow-lg shadow-success-500/30',
  danger: 'bg-danger-500 text-white shadow-lg shadow-danger-500/25',
};

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: 'md' | 'lg';
  /** `stacked` puts the icon above the label, for side-by-side buttons with long labels. */
  arrangement?: 'row' | 'stacked';
  icon?: ReactNode;
  children: ReactNode;
}

/** Large, high-contrast touch target (≥ 56px) with optional haptic feedback. */
export function Button({
  variant = 'primary',
  size = 'lg',
  arrangement = 'row',
  icon,
  className,
  children,
  onClick,
  type = 'button',
  ...rest
}: ButtonProps) {
  const { settings } = useSettings();
  return (
    <m.button
      type={type}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'inline-flex w-full items-center justify-center rounded-2xl font-bold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        arrangement === 'stacked'
          ? 'min-h-20 flex-col gap-1 px-3 py-2 text-base leading-tight'
          : 'gap-3',
        arrangement === 'row' &&
          (size === 'lg' ? 'min-h-16 px-6 text-lg' : 'min-h-14 px-5 text-base'),
        VARIANTS[variant],
        className,
      )}
      onClick={(event) => {
        if (settings.haptics) vibrate(12);
        onClick?.(event);
      }}
      {...rest}
    >
      {icon}
      <span>{children}</span>
    </m.button>
  );
}

export function IconButton({
  label,
  children,
  className,
  ...rest
}: Omit<HTMLMotionProps<'button'>, 'children'> & { label: string; children: ReactNode }) {
  return (
    <m.button
      type="button"
      whileTap={{ scale: 0.92 }}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface text-ink ring-1 ring-line',
        className,
      )}
      {...rest}
    >
      {children}
    </m.button>
  );
}
