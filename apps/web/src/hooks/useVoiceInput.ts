import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@tapcare/shared';

interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

type RecognitionConstructor = new () => Recognition;

function getRecognition(): RecognitionConstructor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** Speech-to-text for the goal field. Falls back gracefully where the API is missing. */
export function useVoiceInput(locale: Locale, onTranscript: (text: string) => void) {
  const Recognition = typeof window !== 'undefined' ? getRecognition() : undefined;
  const recognitionRef = useRef<Recognition | null>(null);
  const [listening, setListening] = useState(false);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!Recognition) return;
    recognitionRef.current?.stop();
    const recognition = new Recognition();
    recognition.lang = locale === 'id' ? 'id-ID' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) onTranscript(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [Recognition, locale, onTranscript]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  return { supported: Boolean(Recognition), listening, start, stop };
}
