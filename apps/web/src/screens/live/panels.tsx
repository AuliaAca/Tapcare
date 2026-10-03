import { Camera, Hand, ImageUp, LifeBuoy, Loader, RefreshCw, SearchX } from 'lucide-react';
import type { GuidanceResponse, StepFeedback } from '@tapcare/shared';
import { Button } from '../../components/Button.tsx';
import { Celebration } from '../../components/Celebration.tsx';
import { FrameView } from '../../components/FrameView.tsx';
import { InstructionCard } from '../../components/InstructionCard.tsx';
import type { MessageKey } from '../../i18n/translate.ts';
import type { CapturedFrame } from '../../lib/image.ts';
import { useSettings } from '../../settings/useSettings.ts';

export function AimingActions({
  canCapture,
  imageError,
  onCapture,
  onUpload,
}: {
  canCapture: boolean;
  imageError: boolean;
  onCapture: () => void;
  onUpload: () => void;
}) {
  const { t } = useSettings();
  return (
    <div className="mt-auto space-y-3">
      {imageError && (
        <p role="alert" className="font-semibold text-danger-500">
          {t('error.image')}
        </p>
      )}
      <Button
        icon={<Camera aria-hidden className="size-6" />}
        onClick={onCapture}
        disabled={!canCapture}
      >
        {t('live.capture')}
      </Button>
      <Button
        variant="secondary"
        size="md"
        icon={<ImageUp aria-hidden className="size-5" />}
        onClick={onUpload}
      >
        {t('live.upload')}
      </Button>
    </div>
  );
}

export function AnalyzingPanel({ frame }: { frame: CapturedFrame }) {
  const { t } = useSettings();
  return (
    <div className="flex flex-1 flex-col gap-5">
      <FrameView src={frame.previewUrl} alt="" scanning />
      <p
        role="status"
        className="flex items-center justify-center gap-3 text-lg font-bold text-brand-600"
      >
        <Loader aria-hidden className="size-6 animate-spin" />
        {t('live.analyzing')}
      </p>
    </div>
  );
}

export function GuidingPanel({
  frame,
  guidance,
  onFeedback,
  onRetake,
  onHelp,
  onRepeat,
}: {
  frame: CapturedFrame;
  guidance: GuidanceResponse;
  onFeedback: (feedback: StepFeedback) => void;
  onRetake: () => void;
  onHelp: () => void;
  onRepeat: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <FrameView
        src={frame.previewUrl}
        alt={guidance.screenSummary}
        target={guidance.target?.box}
      />
      <InstructionCard guidance={guidance} onRepeat={onRepeat} />
      <div className="mt-auto space-y-3">
        <GuidingActions
          status={guidance.status}
          onFeedback={onFeedback}
          onRetake={onRetake}
          onHelp={onHelp}
        />
      </div>
    </div>
  );
}

function GuidingActions({
  status,
  onFeedback,
  onRetake,
  onHelp,
}: {
  status: GuidanceResponse['status'];
  onFeedback: (feedback: StepFeedback) => void;
  onRetake: () => void;
  onHelp: () => void;
}) {
  const { t } = useSettings();
  if (status === 'need_better_view') {
    return (
      <Button icon={<Camera aria-hidden className="size-6" />} onClick={onRetake}>
        {t('live.retake')}
      </Button>
    );
  }
  if (status === 'needs_human') {
    return (
      <>
        <Button
          variant="danger"
          icon={<LifeBuoy aria-hidden className="size-6" />}
          onClick={onHelp}
        >
          {t('live.needHelp')}
        </Button>
        <Button variant="secondary" size="md" onClick={onRetake}>
          {t('live.retake')}
        </Button>
      </>
    );
  }
  return (
    <>
      <Button
        variant="success"
        icon={<Hand aria-hidden className="size-6" />}
        onClick={() => onFeedback('done')}
      >
        {t('live.tapped')}
      </Button>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          arrangement="stacked"
          icon={<SearchX aria-hidden className="size-5" />}
          onClick={() => onFeedback('cant_find')}
        >
          {t('live.cantFind')}
        </Button>
        <Button
          variant="secondary"
          arrangement="stacked"
          icon={<RefreshCw aria-hidden className="size-5" />}
          onClick={() => onFeedback('nothing_happened')}
        >
          {t('live.nothingHappened')}
        </Button>
      </div>
    </>
  );
}

export function DonePanel({
  guidance,
  steps,
  onFinish,
}: {
  guidance: GuidanceResponse;
  steps: number;
  onFinish: () => void;
}) {
  const { t } = useSettings();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <Celebration />
      <h2 className="text-3xl font-extrabold">{t('done.title')}</h2>
      <p aria-live="polite" className="text-xl leading-snug font-semibold text-balance">
        {guidance.instruction}
      </p>
      <p className="text-ink-muted">{t('done.body', { n: steps })}</p>
      <div className="mt-auto w-full">
        <Button onClick={onFinish}>{t('done.finish')}</Button>
      </div>
    </div>
  );
}

export function ErrorPanel({
  frame,
  messageKey,
  onRetry,
  onRetake,
}: {
  frame: CapturedFrame | null;
  messageKey: MessageKey;
  onRetry: () => void;
  onRetake: () => void;
}) {
  const { t } = useSettings();
  return (
    <div className="flex flex-1 flex-col gap-4">
      {frame && <FrameView src={frame.previewUrl} alt="" dimmed />}
      <p
        role="alert"
        className="rounded-2xl bg-danger-50 p-4 text-lg font-semibold text-danger-500"
      >
        {t(messageKey)}
      </p>
      <div className="mt-auto space-y-3">
        <Button icon={<RefreshCw aria-hidden className="size-6" />} onClick={onRetry}>
          {t('common.tryAgain')}
        </Button>
        <Button variant="secondary" size="md" onClick={onRetake}>
          {t('live.retake')}
        </Button>
      </div>
    </div>
  );
}
