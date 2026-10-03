import { useCallback, useEffect } from 'react';
import { useSettings } from '../settings/useSettings.ts';

const VOICE_LANG = { id: 'id-ID', en: 'en-US' } as const;

/** Text-to-speech using the browser's built-in voices. Respects the voice and speed settings. */
export function useSpeech() {
  const { settings } = useSettings();
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const cancel = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  const speak = useCallback(
    (text: string, options: { force?: boolean } = {}) => {
      if (!supported || !text || (!settings.voice && !options.force)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = VOICE_LANG[settings.locale];
      utterance.rate = settings.speechRate;
      const voice = window.speechSynthesis
        .getVoices()
        .find((candidate) =>
          candidate.lang.replace('_', '-').startsWith(utterance.lang.slice(0, 2)),
        );
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    },
    [supported, settings.voice, settings.locale, settings.speechRate],
  );

  useEffect(() => cancel, [cancel]);

  return { supported, speak, cancel };
}
