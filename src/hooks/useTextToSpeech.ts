'use client';

import { useState, useRef, useCallback } from 'react';

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!text || text.trim().length === 0) {
      return;
    }

    setError(null);
    setIsSpeaking(true);

    try {
      // TTS APIを呼び出し
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '音声生成に失敗しました');
      }

      // 音声データを取得
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // 音声を再生
      return new Promise((resolve, reject) => {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          resolve();
        };

        audio.onerror = (e) => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          reject(new Error('音声の再生に失敗しました'));
        };

        audio.play().catch((e) => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          reject(e);
        });
      });
    } catch (e) {
      setIsSpeaking(false);
      const message = e instanceof Error ? e.message : '音声生成エラー';
      setError(message);
      throw e;
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    error,
  };
}
