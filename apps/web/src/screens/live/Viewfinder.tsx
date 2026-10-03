import { CameraOff, Loader } from 'lucide-react';
import type { RefObject } from 'react';
import { Button } from '../../components/Button.tsx';
import type { CameraStatus } from '../../hooks/useCamera.ts';
import type { MessageKey } from '../../i18n/translate.ts';
import { useSettings } from '../../settings/useSettings.ts';

const CAMERA_MESSAGES: Partial<Record<CameraStatus, MessageKey>> = {
  denied: 'live.cameraDenied',
  unavailable: 'live.cameraUnavailable',
  error: 'live.cameraError',
};

const CORNERS = [
  'top-0 left-0 rounded-tl-2xl border-t-4 border-l-4',
  'top-0 right-0 rounded-tr-2xl border-t-4 border-r-4',
  'bottom-0 left-0 rounded-bl-2xl border-b-4 border-l-4',
  'right-0 bottom-0 rounded-br-2xl border-r-4 border-b-4',
];

export function Viewfinder({
  videoRef,
  status,
  onRetry,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  onRetry: () => void;
}) {
  const { t } = useSettings();
  const live = status === 'live';
  const message = CAMERA_MESSAGES[status];

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-card)] bg-[oklch(0.2_0.03_285)] shadow-xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        aria-label={t('live.aimHint')}
        className="size-full object-cover"
      />
      {live ? (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-6">
            {CORNERS.map((corner) => (
              <span key={corner} className={`absolute size-10 border-white/90 ${corner}`} />
            ))}
          </div>
          <p className="absolute inset-x-4 bottom-4 rounded-2xl bg-black/55 px-4 py-3 text-center font-semibold text-white backdrop-blur">
            {t('live.aimHint')}
          </p>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
          {message ? (
            <>
              <CameraOff aria-hidden className="size-12 opacity-80" />
              <p className="leading-snug font-semibold">{t(message)}</p>
              {status !== 'unavailable' && (
                <Button variant="secondary" size="md" className="max-w-xs" onClick={onRetry}>
                  {t('live.startCamera')}
                </Button>
              )}
            </>
          ) : (
            <>
              <Loader aria-hidden className="size-10 animate-spin" />
              <p className="font-semibold">{t('live.cameraStarting')}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
