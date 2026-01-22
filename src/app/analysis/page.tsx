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
import type { TimelineEntry, CommunicationScores, CommunicationAxisScores, AnalysisResultData } from '@/types/analysis';

// テーマカラー
const theme = {
  primary: '#e24f29',      // オレンジレッド（アクセント）
  secondary: '#63a4a6',    // ティールグリーン（サブカラー）
  brown: '#7d6456',        // ブラウン（テキスト）
  primaryLight: '#fef2ef', // プライマリの薄い背景
  secondaryLight: '#f0f7f7', // セカンダリの薄い背景
  brownLight: '#f7f5f4',   // ブラウンの薄い背景
};

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
    eyeContact: 0,
    nodding: 0,
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
      // 5項目の加重平均: 表情(25%) + ジェスチャー(25%) + 姿勢(20%) + アイコンタクト(20%) + 頷き(10%)
      const finalScores = calculateAllScores(timelineRef.current);
      const nonverbalExpression = Math.round(
        finalScores.expressiveness * 0.25 +
        finalScores.gestureActivity * 0.25 +
        finalScores.posturalOpenness * 0.20 +
        finalScores.eyeContact * 0.20 +
        finalScores.nodding * 0.10
      );

      // 軸1, 2, 4は音声テキストからGPTで分析
      let speechScores = {
        assertiveness: 50,
        listening: 50,
        nonverbalReading: 50,
        reasons: {
          assertiveness: '',
          listening: '',
          nonverbalReading: '',
        },
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

      // sessionStorageに結果データを保存
      const resultData: AnalysisResultData = {
        type,
        axisScores,
        detailScores: finalScores,
        axisReasons: {
          assertiveness: speechScores.reasons.assertiveness,
          listening: speechScores.reasons.listening,
          nonverbalExpression: '', // 映像分析のため理由は自動生成
          nonverbalReading: speechScores.reasons.nonverbalReading,
        },
      };
      sessionStorage.setItem('analysisResult', JSON.stringify(resultData));

      // 結果ページに遷移
      router.push(`/result/${type}`);
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
          <div className="text-lg" style={{ color: theme.brown }}>モデルを読み込み中...</div>
        </div>
      )}

      {error && (
        <div className="text-center p-4 rounded mb-4" style={{ backgroundColor: theme.primaryLight, color: theme.primary }}>
          エラー: {error}
        </div>
      )}

      {isReady && (
        <div className="max-w-5xl mx-auto space-y-4">
          {/* メインエリア: 会話ログ + カメラ（右横） */}
          <div className="flex gap-4 items-stretch">
            {/* 会話ログ（メイン） */}
            <div className="flex-1 rounded-lg shadow-sm p-4" style={{ backgroundColor: 'white', border: `1px solid ${theme.brown}20` }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold" style={{ color: theme.brown }}>会話</h2>
                {/* 状態表示 */}
                <div className="text-sm">
                  {(conversationState === 'ai_speaking' || tts.isSpeaking || conversation.isLoading) && (
                    <span className="font-medium" style={{ color: theme.primary }}>
                      {conversation.isLoading ? '🤔 考え中...' : '🔊 AIが話しています...'}
                    </span>
                  )}
                  {conversationState === 'user_speaking' && !tts.isSpeaking && !conversation.isLoading && (
                    <span className="font-medium" style={{ color: theme.secondary }}>
                      🎤 {recorder.hasSpeechStarted ? '自動送信待ち...' : 'お話しください'}
                    </span>
                  )}
                  {conversationState === 'processing' && !conversation.isLoading && (
                    <span className="font-medium" style={{ color: theme.brown }}>⏳ 文字起こし中...</span>
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

            {/* カメラ + ボタン（右横） */}
            <div className="flex-shrink-0 w-48 md:w-56 flex flex-col">
              {/* カメラ */}
              <div className="rounded-lg overflow-hidden shadow-lg relative" style={{ border: `2px solid ${theme.secondary}60` }}>
                <WebcamCapture
                  onFrame={handleFrame}
                  isAnalyzing={isAnalyzing}
                />
                {/* 録音インジケーター */}
                {conversationState === 'user_speaking' && recorder.isRecording && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded text-white text-xs">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.primary }} />
                    REC
                  </div>
                )}
              </div>

              {/* 操作ボタン（カメラの下） */}
              <div className="flex-1 flex flex-col justify-end mt-3 gap-2">
                {!isAnalyzing ? (
                  <button
                    onClick={handleStartConversation}
                    disabled={isProcessing}
                    className="w-full text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 text-sm"
                    style={{ backgroundColor: theme.secondary }}
                  >
                    会話を開始
                  </button>
                ) : (
                  <>
                    {conversationState === 'user_speaking' && (
                      <button
                        onClick={handleSendMessage}
                        className="w-full text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90 text-sm"
                        style={{ backgroundColor: theme.secondary }}
                      >
                        発言を送信
                      </button>
                    )}
                    <button
                      onClick={handleEndConversation}
                      className="w-full text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90 text-sm"
                      style={{ backgroundColor: theme.brown }}
                    >
                      会話を終了
                    </button>
                  </>
                )}

                {conversation.messages.length > 0 && !isAnalyzing && (
                  <button
                    onClick={handleAnalyze}
                    disabled={isProcessing}
                    className="w-full text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 text-sm"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {isProcessing ? '分析中...' : '結果を見る'}
                  </button>
                )}
              </div>
            </div>
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
