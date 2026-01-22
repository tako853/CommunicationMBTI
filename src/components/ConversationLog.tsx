'use client';

import { useEffect, useRef } from 'react';
import type { ConversationMessage } from '@/hooks/useConversation';

// テーマカラー
const theme = {
  primary: '#e24f29',      // オレンジレッド（アクセント）
  secondary: '#63a4a6',    // ティールグリーン（サブカラー）
  brown: '#7d6456',        // ブラウン（テキスト）
  primaryLight: '#fef2ef', // プライマリの薄い背景
  secondaryLight: '#f0f7f7', // セカンダリの薄い背景
  brownLight: '#f7f5f4',   // ブラウンの薄い背景
};

interface ConversationLogProps {
  messages: ConversationMessage[];
  isLoading?: boolean;
  isSpeaking?: boolean;
  isUserSpeaking?: boolean;
  isRecording?: boolean;
  hasSpeechStarted?: boolean;
  isProcessing?: boolean;
}

export function ConversationLog({
  messages,
  isLoading,
  isSpeaking,
  isUserSpeaking,
  isRecording,
  hasSpeechStarted,
  isProcessing,
}: ConversationLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isSpeaking, isUserSpeaking, isProcessing]);

  return (
    <div
      ref={scrollRef}
      className="h-[320px] overflow-y-auto rounded-xl p-4"
      style={{ backgroundColor: theme.brownLight, border: `1px solid ${theme.brown}30` }}
    >
      {messages.length === 0 && !isLoading && !isSpeaking ? (
        <div className="h-full flex flex-col items-center justify-center" style={{ color: `${theme.brown}80` }}>
          <svg className="w-12 h-12 mb-3" style={{ color: `${theme.brown}50` }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm">会話を開始すると、ここにログが表示されます</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* アバター */}
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: msg.role === 'user' ? theme.secondary : theme.primary }}
                >
                  {msg.role === 'user' ? 'You' : 'AI'}
                </div>

                {/* メッセージバブル */}
                <div
                  className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                    msg.role === 'user' ? 'rounded-br-md text-white' : 'rounded-bl-md'
                  }`}
                  style={{
                    backgroundColor: msg.role === 'user' ? theme.secondary : 'white',
                    color: msg.role === 'user' ? 'white' : theme.brown,
                    border: msg.role === 'user' ? 'none' : `1px solid ${theme.brown}20`,
                  }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}

          {/* ローディング表示（考え中） */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: theme.primary }}
                >
                  AI
                </div>
                <div
                  className="rounded-2xl rounded-bl-md px-4 py-3 shadow-sm"
                  style={{ backgroundColor: 'white', border: `1px solid ${theme.brown}20` }}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 音声再生中表示 */}
          {isSpeaking && (
            <div className="flex justify-start">
              <div
                className="flex items-center gap-2 rounded-full px-4 py-2"
                style={{ backgroundColor: theme.primaryLight, border: `1px solid ${theme.primary}40` }}
              >
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 rounded-full animate-pulse" style={{ backgroundColor: theme.primary }} />
                  <span className="w-1 h-4 rounded-full animate-pulse" style={{ backgroundColor: theme.primary, animationDelay: '75ms' }} />
                  <span className="w-1 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.primary, animationDelay: '150ms' }} />
                  <span className="w-1 h-5 rounded-full animate-pulse" style={{ backgroundColor: theme.primary, animationDelay: '225ms' }} />
                  <span className="w-1 h-3 rounded-full animate-pulse" style={{ backgroundColor: theme.primary, animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-medium" style={{ color: theme.primary }}>AIが話しています</span>
              </div>
            </div>
          )}

          {/* ユーザー発話中表示 */}
          {isUserSpeaking && (
            <div className="flex justify-end">
              <div
                className="flex items-center gap-2 rounded-full px-4 py-2"
                style={{ backgroundColor: theme.secondaryLight, border: `1px solid ${theme.secondary}40` }}
              >
                {isRecording && (
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                    <div className="absolute inset-0 w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: theme.primary }} />
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="w-1 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.secondary }} />
                  <span className="w-1 h-4 rounded-full animate-pulse" style={{ backgroundColor: theme.secondary, animationDelay: '75ms' }} />
                  <span className="w-1 h-3 rounded-full animate-pulse" style={{ backgroundColor: theme.secondary, animationDelay: '150ms' }} />
                  <span className="w-1 h-5 rounded-full animate-pulse" style={{ backgroundColor: theme.secondary, animationDelay: '225ms' }} />
                  <span className="w-1 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.secondary, animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-medium" style={{ color: theme.secondary }}>
                  {hasSpeechStarted ? '話し終わると送信' : 'お話しください'}
                </span>
              </div>
            </div>
          )}

          {/* 文字起こし中表示 */}
          {isProcessing && (
            <div className="flex justify-end">
              <div
                className="flex items-center gap-2 rounded-full px-4 py-2"
                style={{ backgroundColor: theme.brownLight, border: `1px solid ${theme.brown}30` }}
              >
                <svg className="w-4 h-4 animate-spin" style={{ color: theme.brown }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-xs font-medium" style={{ color: theme.brown }}>文字起こし中...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
