'use client';

import { useEffect, useRef } from 'react';
import type { ConversationMessage } from '@/hooks/useConversation';

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
      className="h-[320px] overflow-y-auto bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 p-4"
    >
      {messages.length === 0 && !isLoading && !isSpeaking ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
          <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white'
                  }`}
                >
                  {msg.role === 'user' ? 'You' : 'AI'}
                </div>

                {/* メッセージバブル */}
                <div
                  className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'
                  }`}
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
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                  AI
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 音声再生中表示 */}
          {isSpeaking && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2">
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-amber-500 rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '75ms' }} />
                  <span className="w-1 h-2 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-5 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '225ms' }} />
                  <span className="w-1 h-3 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-medium text-amber-700">AIが話しています</span>
              </div>
            </div>
          )}

          {/* ユーザー発話中表示 */}
          {isUserSpeaking && (
            <div className="flex justify-end">
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
                {isRecording && (
                  <div className="relative">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="w-1 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '75ms' }} />
                  <span className="w-1 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '225ms' }} />
                  <span className="w-1 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-medium text-blue-700">
                  {hasSpeechStarted ? '話し終わると送信' : 'お話しください'}
                </span>
              </div>
            </div>
          )}

          {/* 文字起こし中表示 */}
          {isProcessing && (
            <div className="flex justify-end">
              <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-2">
                <svg className="w-4 h-4 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-xs font-medium text-gray-600">文字起こし中...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
