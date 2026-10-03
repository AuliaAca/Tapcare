import { useId } from 'react';
import { cn } from '../lib/cn.ts';

/** Accessible single-choice control rendered as large pill buttons (a radio group). */
export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 font-bold">{label}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-2 rounded-2xl bg-surface-muted p-1.5">
        {options.map((option) => (
          <label
            key={String(option.value)}
            className={cn(
              'flex min-h-12 cursor-pointer items-center justify-center rounded-xl px-2 text-center text-sm font-bold transition-colors',
              'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand-400',
              value === option.value ? 'bg-surface text-brand-600 shadow-sm' : 'text-ink-muted',
            )}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 font-bold">
      {label}
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          'relative h-8 w-14 shrink-0 rounded-full transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-brand-400',
          checked ? 'bg-brand-500' : 'bg-line',
        )}
      >
        <span
          className={cn(
            'absolute top-1 size-6 rounded-full bg-white shadow transition-[left]',
            checked ? 'left-7' : 'left-1',
          )}
        />
      </span>
    </label>
  );
}
