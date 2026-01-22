'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioRecorderOptions {
  silenceTimeout?: number; // 沈黙と判定するまでの時間（ms）
  onSilenceDetected?: () => void; // 沈黙検出時のコールバック
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const { silenceTimeout = 2000, onSilenceDetected } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSpeechStarted, setHasSpeechStarted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');
  const isActiveRef = useRef(false);
  const onSilenceDetectedRef = useRef(onSilenceDetected);

  // コールバックの更新
  useEffect(() => {
    onSilenceDetectedRef.current = onSilenceDetected;
  }, [onSilenceDetected]);

  // Web Speech APIの初期化
  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ja-JP';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        // 発話が始まったことを検出
        if (currentTranscript.length > 0 && !hasSpeechStarted) {
          setHasSpeechStarted(true);
        }

        // トランスクリプトが変化したら沈黙タイマーをリセット
        if (currentTranscript !== lastTranscriptRef.current) {
          lastTranscriptRef.current = currentTranscript;

          // 既存のタイマーをクリア
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // 発話があった場合のみ沈黙タイマーを開始
          if (currentTranscript.length > 0 && isActiveRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              // 沈黙を検出
              if (isActiveRef.current && onSilenceDetectedRef.current) {
                onSilenceDetectedRef.current();
              }
            }, silenceTimeout);
          }
        }
      };

      recognition.onerror = (event: Event) => {
        const errorEvent = event as Event & { error: string };
        if (errorEvent.error !== 'no-speech' && errorEvent.error !== 'aborted') {
          console.error('Speech recognition error:', errorEvent.error);
        }
      };

      recognition.onend = () => {
        // 録音中なら自動再開
        if (isActiveRef.current && recognitionRef.current) {
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
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [silenceTimeout, hasSpeechStarted]);

  // 録音開始
  const startRecording = useCallback(async () => {
    setError(null);
    chunksRef.current = [];
    lastTranscriptRef.current = '';
    setHasSpeechStarted(false);
    isActiveRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);

      // Web Speech APIも開始（沈黙検出用）
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // 既に開始している場合は無視
        }
      }
    } catch (e) {
      console.error('Failed to start recording:', e);
      setError('マイクへのアクセスに失敗しました');
      isActiveRef.current = false;
    }
  }, []);

  // 録音停止して音声データを返す
  const stopRecording = useCallback((): Promise<Blob | null> => {
    isActiveRef.current = false;

    // 沈黙タイマーをクリア
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Web Speech APIを停止
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // 無視
      }
    }

    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        setIsRecording(false);
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];

        // ストリームを停止
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        setIsRecording(false);
        setHasSpeechStarted(false);
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  // Whisper APIで文字起こし
  const transcribe = useCallback(async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '文字起こしに失敗しました');
    }

    const data = await response.json();
    return data.text;
  }, []);

  // 録音停止→文字起こしを一括で行う
  const stopAndTranscribe = useCallback(async (): Promise<string> => {
    const audioBlob = await stopRecording();
    if (!audioBlob || audioBlob.size === 0) {
      return '';
    }
    return transcribe(audioBlob);
  }, [stopRecording, transcribe]);

  return {
    isRecording,
    hasSpeechStarted,
    error,
    startRecording,
    stopRecording,
    stopAndTranscribe,
  };
}
