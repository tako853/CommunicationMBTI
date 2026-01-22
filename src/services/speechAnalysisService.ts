// GPT分析APIを呼び出すサービス

export interface SpeechAnalysisResult {
  assertiveness: number;    // 軸1: 伝える力 (0-100)
  listening: number;        // 軸2: 聞く力 (0-100)
  nonverbalReading: number; // 軸4: 非言語を読み取る力 (0-100)
}

export async function analyzeSpeech(
  transcript: string,
  duration: number
): Promise<SpeechAnalysisResult> {
  const response = await fetch('/api/analyze-speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transcript, duration }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '分析に失敗しました');
  }

  return response.json();
}
