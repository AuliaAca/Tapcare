import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useSettings } from '../settings/useSettings.ts';
import { IconButton } from './Button.tsx';

/**
 * Bottom sheet built on the native <dialog>: focus trapping, Escape to close,
 * and inert background come from the platform instead of custom code.
 */
export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { t } = useSettings();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-0 mt-auto w-full max-w-none bg-transparent p-0 text-ink backdrop:bg-transparent sm:mx-auto sm:mb-6 sm:max-w-md"
    >
      <div className="max-h-[85dvh] overflow-y-auto rounded-t-[var(--radius-card)] bg-surface px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[var(--radius-card)]">
        <div aria-hidden className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" />
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-2xl font-extrabold">
            {title}
          </h2>
          <IconButton label={t('common.close')} onClick={onClose}>
            <X aria-hidden className="size-6" />
          </IconButton>
        </div>
        {children}
      </div>
    </dialog>
  );
}
