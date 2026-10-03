import { act, cleanup, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSpeech } from '../src/hooks/useSpeech.ts';
import { captureVideoFrame, fileToFrame } from '../src/lib/image.ts';
import { GoalScreen } from '../src/screens/GoalScreen.tsx';
import { defaultSettings } from '../src/settings/settings.ts';
import { SettingsProvider } from '../src/settings/SettingsContext.tsx';
import { renderWithSettings } from './render.tsx';

afterEach(() => {
  // Unmount first so hooks can still reach the fake APIs during cleanup.
  cleanup();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(window, 'speechSynthesis');
  Reflect.deleteProperty(window, 'webkitSpeechRecognition');
});

describe('useSpeech', () => {
  function installSynth() {
    const synth = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: () => [{ lang: 'id_ID', name: 'Damayanti' }],
    };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synth });
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        lang = '';
        rate = 1;
        voice: unknown = null;
        constructor(public text: string) {}
      },
    );
    return synth;
  }

  const wrapper =
    (voice: boolean) =>
    ({ children }: { children: ReactNode }) => (
      <SettingsProvider initial={{ ...defaultSettings(['id-ID']), voice }}>
        {children}
      </SettingsProvider>
    );

  it('speaks in the user language and pace, with a matching voice', () => {
    const synth = installSynth();
    const { result } = renderHook(() => useSpeech(), { wrapper: wrapper(true) });
    act(() => result.current.speak('Tekan Mulai'));
    const utterance = synth.speak.mock.calls[0]![0];
    expect(utterance).toMatchObject({ text: 'Tekan Mulai', lang: 'id-ID', rate: 0.85 });
    expect(utterance.voice).toMatchObject({ name: 'Damayanti' });
  });

  it('stays quiet when voice is off unless forced (the Repeat button)', () => {
    const synth = installSynth();
    const { result } = renderHook(() => useSpeech(), { wrapper: wrapper(false) });
    act(() => result.current.speak('a'));
    expect(synth.speak).not.toHaveBeenCalled();
    act(() => result.current.speak('a', { force: true }));
    expect(synth.speak).toHaveBeenCalledTimes(1);
  });

  it('reports unsupported browsers', () => {
    const { result } = renderHook(() => useSpeech(), { wrapper: wrapper(true) });
    expect(result.current.supported).toBe(false);
    expect(() => result.current.speak('x')).not.toThrow();
  });
});

describe('voice input on the goal screen', () => {
  it('fills the goal from speech', async () => {
    class FakeRecognition {
      lang = '';
      interimResults = true;
      maxAlternatives = 5;
      onresult: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      start() {
        queueMicrotask(() => {
          this.onresult?.({ results: [[{ transcript: ' bayar parkir ' }]] });
          this.onend?.();
        });
      }
      stop() {
        this.onend?.();
      }
    }
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: FakeRecognition,
    });
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithSettings(<GoalScreen onBack={vi.fn()} onSettings={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /ucapkan/i }));
    expect(await screen.findByDisplayValue('bayar parkir')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /lanjut/i }));
    expect(onSubmit).toHaveBeenCalledWith('bayar parkir');
  });

  it('hides the microphone where speech recognition is missing', () => {
    renderWithSettings(<GoalScreen onBack={vi.fn()} onSettings={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /ucapkan/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lanjut/i })).toBeDisabled();
  });
});

describe('image encoding', () => {
  function mockCanvas() {
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/jpeg;base64,QUJD',
    );
    return drawImage;
  }

  it('downscales video frames to JPEG', () => {
    const drawImage = mockCanvas();
    const video = document.createElement('video');
    Object.defineProperty(video, 'videoWidth', { value: 2560 });
    Object.defineProperty(video, 'videoHeight', { value: 1920 });

    const frame = captureVideoFrame(video);

    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1280, 960);
    expect(frame.image).toEqual({
      mediaType: 'image/jpeg',
      data: 'QUJD',
      width: 1280,
      height: 960,
    });
  });

  it('decodes gallery photos with EXIF orientation and frees the bitmap', async () => {
    mockCanvas();
    const close = vi.fn();
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({ width: 800, height: 600, close }),
    );
    const frame = await fileToFrame(new File(['x'], 'a.jpg', { type: 'image/jpeg' }));
    expect(frame.image.width).toBe(800);
    expect(createImageBitmap).toHaveBeenCalledWith(expect.any(File), {
      imageOrientation: 'from-image',
    });
    expect(close).toHaveBeenCalled();
  });

  it('rejects non-image files', async () => {
    await expect(fileToFrame(new File(['x'], 'a.txt', { type: 'text/plain' }))).rejects.toThrow();
  });

  it('fails clearly without canvas support', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const video = document.createElement('video');
    Object.defineProperty(video, 'videoWidth', { value: 100 });
    Object.defineProperty(video, 'videoHeight', { value: 100 });
    expect(() => captureVideoFrame(video)).toThrow(/canvas/i);
  });
});
