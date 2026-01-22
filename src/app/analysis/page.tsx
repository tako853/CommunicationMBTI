'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WebcamCapture } from '@/components/WebcamCapture';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { ConversationLog } from '@/components/ConversationLog';
import { useFaceAnalysis } from '@/hooks/useFaceAnalysis';
import { useMediaPipe } from '@/hooks/useMediaPipe';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useConversation } from '@/hooks/useConversation';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { calculateAllScores } from '@/services/scoreEngine';
import { analyzeSpeech } from '@/services/speechAnalysisService';
import { determineType } from '@/data/communicationTypes';
import type { TimelineEntry, CommunicationScores, CommunicationAxisScores } from '@/types/analysis';

type ConversationState = 'idle' | 'ai_speaking' | 'user_speaking' | 'processing';

export default function AnalysisPage() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [scores, setScores] = useState<CommunicationScores>({
    expressiveness: 0,
    gestureActivity: 0,
    posturalOpenness: 0,
  });

  const timelineRef = useRef<TimelineEntry[]>([]);
  const userSpeechRef = useRef<string>('');
  const conversationStateRef = useRef<ConversationState>('idle');

  const faceAnalysis = useFaceAnalysis();
  const mediaPipe = useMediaPipe();
  const conversation = useConversation();
  const tts = useTextToSpeech();

  // 沈黙検出時のハンドラーをrefで保持（循環参照回避）
  const handleSendMessageRef = useRef<() => void>(() => {});

  // 沈黙検出時に自動送信
  const handleSilenceDetected = useCallback(() => {
    // user_speaking状態の時のみ自動送信
    if (conversationStateRef.current === 'user_speaking') {
      handleSendMessageRef.current();
    }
  }, []);

  const recorder = useAudioRecorder({
    silenceTimeout: 2000, // 2秒の沈黙で送信
    onSilenceDetected: handleSilenceDetected,
  });

  const isLoading = faceAnalysis.isLoading || mediaPipe.isLoading;
  const isReady = faceAnalysis.isReady && mediaPipe.isReady;
  const error = faceAnalysis.error || mediaPipe.error || recorder.error || conversation.error || tts.error;

  const handleFrame = useCallback(
    async (video: HTMLVideoElement) => {
      await Promise.all([
        faceAnalysis.analyze(video),
        mediaPipe.analyze(video),
      ]);

      const entry: TimelineEntry = {
        timestamp: Date.now(),
        expressions: faceAnalysis.currentExpressions,
        pose: mediaPipe.currentPose,
        gesture: mediaPipe.currentGesture,
        headPose: mediaPipe.currentHeadPose,
        gaze: mediaPipe.currentGaze,
        handShape: mediaPipe.currentHandShape,
        bodyMovement: mediaPipe.currentBodyMovement,
      };

      timelineRef.current.push(entry);

      // リアルタイムスコア更新（最新30エントリで計算）
      const recentEntries = timelineRef.current.slice(-30);
      const newScores = calculateAllScores(recentEntries);
      setScores(newScores);
    },
    [faceAnalysis, mediaPipe]
  );

  // conversationStateを更新するヘルパー
  const updateConversationState = useCallback((state: ConversationState) => {
    setConversationState(state);
    conversationStateRef.current = state;
  }, []);

  // ユーザーが話し終わったら送信
  const handleSendMessage = useCallback(async () => {
    updateConversationState('processing');

    try {
      // 録音停止→Whisperで文字起こし
      const userMessage = await recorder.stopAndTranscribe();

      if (!userMessage || userMessage.trim().length === 0) {
        // 発言がなければ再度録音開始
        updateConversationState('user_speaking');
        await recorder.startRecording();
        return;
      }

      userSpeechRef.current += userMessage + '\n';

      // AIの返答を取得（テキストはまだ表示しない）
      const aiText = await conversation.sendMessage(userMessage, true);
      updateConversationState('ai_speaking');

      // 音声を再生
      await tts.speak(aiText);

      // 音声再生後にテキストを表示
      conversation.addPendingMessage();

      // 再びユーザーのターン：録音開始
      updateConversationState('user_speaking');
      await recorder.startRecording();
    } catch (e) {
      console.error('Failed to send message:', e);
      updateConversationState('user_speaking');
      await recorder.startRecording();
    }
  }, [updateConversationState, recorder, conversation, tts]);

  // handleSendMessageをrefに登録
  handleSendMessageRef.current = handleSendMessage;

  // 会話を開始
  const handleStartConversation = async () => {
    timelineRef.current = [];
    userSpeechRef.current = '';
    setIsAnalyzing(true);
    updateConversationState('ai_speaking');

    try {
      // AIが最初に話しかける（テキストはまだ表示しない）
      const aiMessage = await conversation.startConversation(true);

      // 音声を再生
      await tts.speak(aiMessage);

      // 音声再生後にテキストを表示
      conversation.addPendingMessage();

      // ユーザーのターン：録音開始
      updateConversationState('user_speaking');
      await recorder.startRecording();
    } catch (e) {
      console.error('Failed to start conversation:', e);
      updateConversationState('idle');
      setIsAnalyzing(false);
    }
  };

  // 会話を終了
  const handleEndConversation = async () => {
    await recorder.stopRecording();
    tts.stop();
    setIsAnalyzing(false);
    updateConversationState('idle');
  };

  // 結果を分析
  const handleAnalyze = async () => {
    setIsProcessing(true);

    try {
      // 軸3（非言語を伝える力）は映像から計算
      const finalScores = calculateAllScores(timelineRef.current);
      const nonverbalExpression = Math.round(
        (finalScores.expressiveness + finalScores.gestureActivity + finalScores.posturalOpenness) / 3
      );

      // 軸1, 2, 4は音声テキストからGPTで分析
      let speechScores = {
        assertiveness: 50,
        listening: 50,
        nonverbalReading: 50,
      };

      const userTranscript = conversation.getUserTranscript();
      const duration = conversation.getDuration();

      if (userTranscript.trim().length > 0) {
        try {
          speechScores = await analyzeSpeech(userTranscript, duration);
        } catch (e) {
          console.error('Speech analysis failed:', e);
        }
      }

      // 全軸のスコアを統合
      const axisScores: CommunicationAxisScores = {
        assertiveness: speechScores.assertiveness,
        listening: speechScores.listening,
        nonverbalExpression,
        nonverbalReading: speechScores.nonverbalReading,
      };

      // タイプを判定
      const type = determineType(axisScores);

      // 結果ページに遷移
      const params = new URLSearchParams({
        a: axisScores.assertiveness.toString(),
        l: axisScores.listening.toString(),
        n: axisScores.nonverbalExpression.toString(),
        r: axisScores.nonverbalReading.toString(),
      });

      router.push(`/result/${type}?${params.toString()}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="flex justify-center mb-4">
        <img
          src="/types/logo.jpg"
          alt="コミュニケーションMBTI"
          style={{ height: '60px', width: 'auto' }}
        />
      </div>

      {isLoading && (
        <div className="text-center p-8">
          <div className="text-lg">モデルを読み込み中...</div>
        </div>
      )}

      {error && (
        <div className="text-center p-4 bg-red-100 text-red-700 rounded mb-4">
          エラー: {error}
        </div>
      )}

      {isReady && (
        <div className="max-w-5xl mx-auto space-y-4">
          {/* メインエリア: 会話ログ + カメラ（右横） */}
          <div className="flex gap-4">
            {/* 会話ログ（メイン） */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">会話</h2>
                {/* 状態表示 */}
                <div className="text-sm">
                  {(conversationState === 'ai_speaking' || tts.isSpeaking || conversation.isLoading) && (
                    <span className="text-orange-600 font-medium">
                      {conversation.isLoading ? '🤔 考え中...' : '🔊 AIが話しています...'}
                    </span>
                  )}
                  {conversationState === 'user_speaking' && !tts.isSpeaking && !conversation.isLoading && (
                    <span className="text-blue-600 font-medium">
                      🎤 {recorder.hasSpeechStarted ? '自動送信待ち...' : 'お話しください'}
                    </span>
                  )}
                  {conversationState === 'processing' && !conversation.isLoading && (
                    <span className="text-gray-600 font-medium">⏳ 文字起こし中...</span>
                  )}
                </div>
              </div>
              <ConversationLog
                messages={conversation.messages}
                isLoading={conversation.isLoading}
                isSpeaking={tts.isSpeaking}
                isUserSpeaking={conversationState === 'user_speaking' && !tts.isSpeaking}
                isRecording={recorder.isRecording}
                hasSpeechStarted={recorder.hasSpeechStarted}
                isProcessing={conversationState === 'processing' && !conversation.isLoading}
              />
            </div>

            {/* カメラ（右横） */}
            <div className="flex-shrink-0 w-48 md:w-56">
              <div className="rounded-lg overflow-hidden shadow-lg border-2 border-gray-200 relative">
                <WebcamCapture
                  onFrame={handleFrame}
                  isAnalyzing={isAnalyzing}
                />
                {/* 録音インジケーター */}
                {conversationState === 'user_speaking' && recorder.isRecording && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded text-white text-xs">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    REC
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 操作ボタン */}
          <div className="flex gap-2 justify-center flex-wrap">
            {!isAnalyzing ? (
              <button
                onClick={handleStartConversation}
                disabled={isProcessing}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                会話を開始
              </button>
            ) : (
              <>
                {conversationState === 'user_speaking' && (
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    発言を送信
                  </button>
                )}
                <button
                  onClick={handleEndConversation}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  会話を終了
                </button>
              </>
            )}

            {conversation.messages.length > 0 && !isAnalyzing && (
              <button
                onClick={handleAnalyze}
                disabled={isProcessing}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {isProcessing ? '分析中...' : '結果を見る'}
              </button>
            )}
          </div>

          {/* スコア表示 */}
          <ScoreDisplay
            scores={scores}
            currentExpressions={faceAnalysis.currentExpressions}
            currentPose={mediaPipe.currentPose}
            currentGesture={mediaPipe.currentGesture}
            currentHeadPose={mediaPipe.currentHeadPose}
            currentGaze={mediaPipe.currentGaze}
            currentHandShape={mediaPipe.currentHandShape}
            currentBodyMovement={mediaPipe.currentBodyMovement}
          />
        </div>
      )}
    </div>
  );
}
