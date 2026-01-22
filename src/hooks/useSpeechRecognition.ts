'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// Web Speech API の型定義
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface SpeechData {
  transcript: string;        // 認識されたテキスト
  interimTranscript: string; // 確定前のテキスト
  duration: number;          // 録音時間（秒）
  isListening: boolean;      // 録音中かどうか
}

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);

  // isListeningの変更をrefに反映
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // ブラウザサポートチェック（初回のみ）
  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    setIsSupported(!!SpeechRecognitionAPI);

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ja-JP';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        if (final) {
          setTranscript((prev) => prev + final);
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: Event) => {
        const errorEvent = event as Event & { error: string };
        console.error('Speech recognition error:', errorEvent.error);
        if (errorEvent.error !== 'no-speech') {
          setError(`音声認識エラー: ${errorEvent.error}`);
        }
      };

      recognition.onend = () => {
        // 録音中なら自動再開（ブラウザが勝手に止める対策）
        // refを使って最新の状態を参照
        if (isListeningRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {
            // 既に開始している場合は無視
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []); // 依存配列を空に

  const start = useCallback(() => {
    if (!recognitionRef.current) {
      setError('音声認識がサポートされていません');
      return;
    }

    setTranscript('');
    setInterimTranscript('');
    setError(null);
    startTimeRef.current = Date.now();
    durationRef.current = 0;
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setError('音声認識の開始に失敗しました');
      setIsListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      setIsListening(false);
      durationRef.current = (Date.now() - startTimeRef.current) / 1000;
      recognitionRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    durationRef.current = 0;
    setError(null);
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    duration: durationRef.current,
    start,
    stop,
    reset,
  };
}
