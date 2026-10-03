import { useCallback, useEffect, useRef, useState } from 'react';
import { captureVideoFrame, type CapturedFrame } from '../lib/image.ts';

export type CameraStatus = 'idle' | 'starting' | 'live' | 'denied' | 'unavailable' | 'error';

const CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
};

function statusFromError(error: unknown): CameraStatus {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') return 'denied';
    if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError')
      return 'unavailable';
  }
  return 'error';
}

/**
 * Owns the camera stream lifecycle. The stream is always stopped on unmount
 * and whenever `stop` is called, so the camera light never stays on by accident.
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Bumped on every start/stop so a slow getUserMedia from an older request can be discarded.
  const generationRef = useRef(0);
  const [status, setStatus] = useState<CameraStatus>('idle');

  const stop = useCallback(() => {
    generationRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable');
      return;
    }
    const generation = ++generationRef.current;
    setStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
      if (generation !== generationRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Autoplay can be refused (e.g. low-power mode); `autoPlay` on the element retries on its own.
        await videoRef.current.play().catch(() => undefined);
      }
      setStatus('live');
    } catch (error) {
      if (generation === generationRef.current) setStatus(statusFromError(error));
    }
  }, []);

  const capture = useCallback((): CapturedFrame | null => {
    const video = videoRef.current;
    if (!video || status !== 'live' || video.videoWidth === 0) return null;
    return captureVideoFrame(video);
  }, [status]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  return { videoRef, status, start, stop, capture };
}
