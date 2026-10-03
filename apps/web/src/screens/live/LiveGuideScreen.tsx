import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ProviderBadge } from '../../components/ProviderBadge.tsx';
import { Screen } from '../../components/Screen.tsx';
import { TopBar } from '../../components/TopBar.tsx';
import { completedSteps } from '../../hooks/guidanceSession.ts';
import { useCamera } from '../../hooks/useCamera.ts';
import { useGuidanceSession } from '../../hooks/useGuidanceSession.ts';
import { useSpeech } from '../../hooks/useSpeech.ts';
import type { requestGuidance } from '../../lib/api.ts';
import { errorMessageKey, spokenText } from '../../lib/guidance.ts';
import { fileToFrame } from '../../lib/image.ts';
import { useSettings } from '../../settings/useSettings.ts';
import { AimingActions, AnalyzingPanel, DonePanel, ErrorPanel, GuidingPanel } from './panels.tsx';
import { Viewfinder } from './Viewfinder.tsx';

/**
 * The live agent loop: aim → capture → the AI picks one tap → the user reports
 * back → capture the next screen. Each phase renders its own panel.
 */
export function LiveGuideScreen({
  goal,
  onExit,
  onHelp,
  onSettings,
  request,
}: {
  goal: string;
  onExit: () => void;
  onHelp: () => void;
  onSettings: () => void;
  request?: typeof requestGuidance;
}) {
  const { t, settings } = useSettings();
  const {
    videoRef,
    status: cameraStatus,
    start: startCamera,
    stop: stopCamera,
    capture,
  } = useCamera();
  const session = useGuidanceSession({ goal, locale: settings.locale, request });
  const { speak, cancel } = useSpeech();
  const fileInput = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);
  const { state, analyze, retry, giveFeedback, retake } = session;
  const { phase, guidance, frame } = state;

  // The camera runs only while aiming: better for privacy and battery.
  useEffect(() => {
    if (phase !== 'aiming') return;
    void startCamera();
    return stopCamera;
  }, [phase, startCamera, stopCamera]);

  useEffect(() => {
    if (guidance && (phase === 'guiding' || phase === 'done')) speak(spokenText(guidance));
    else cancel();
  }, [guidance, phase, speak, cancel]);

  const onCapture = () => {
    const captured = capture();
    if (captured) void analyze(captured);
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setImageError(false);
      void analyze(await fileToFrame(file));
    } catch {
      setImageError(true);
    }
  };

  return (
    <Screen label={t('live.title')}>
      <TopBar
        onBack={onExit}
        onSettings={onSettings}
        eyebrow={guidance ? t('common.step', { n: guidance.stepNumber }) : t('live.goal', { goal })}
        title={t('live.title')}
      />
      {guidance && (
        <div className="-mt-2 mb-3">
          <ProviderBadge provider={guidance.meta.provider} />
        </div>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        data-testid="file-input"
        onChange={onFile}
      />

      {phase === 'aiming' && (
        <div className="flex flex-1 flex-col gap-4">
          <Viewfinder
            videoRef={videoRef}
            status={cameraStatus}
            onRetry={() => void startCamera()}
          />
          <AimingActions
            canCapture={cameraStatus === 'live'}
            imageError={imageError}
            onCapture={onCapture}
            onUpload={() => fileInput.current?.click()}
          />
        </div>
      )}
      {phase === 'analyzing' && frame && <AnalyzingPanel frame={frame} />}
      {phase === 'guiding' && frame && guidance && (
        <GuidingPanel
          frame={frame}
          guidance={guidance}
          onFeedback={giveFeedback}
          onRetake={retake}
          onHelp={onHelp}
          onRepeat={() => speak(spokenText(guidance), { force: true })}
        />
      )}
      {phase === 'done' && guidance && (
        <DonePanel guidance={guidance} steps={completedSteps(state)} onFinish={onExit} />
      )}
      {phase === 'error' && (
        <ErrorPanel
          frame={frame}
          messageKey={errorMessageKey(state.errorCode)}
          onRetry={retry}
          onRetake={retake}
        />
      )}
    </Screen>
  );
}
