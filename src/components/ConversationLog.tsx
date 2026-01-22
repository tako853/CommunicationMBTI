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
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      style={{
        height: '300px',
        overflowY: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#f9fafb',
      }}
    >
      {messages.length === 0 && !isLoading && !isSpeaking ? (
        <div style={{ color: '#9ca3af', textAlign: 'center', marginTop: '100px' }}>
          会話を開始すると、ここにログが表示されます
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: msg.role === 'user' ? '#3b82f6' : '#ffffff',
                  color: msg.role === 'user' ? '#ffffff' : '#1f2937',
                  border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div style={{ fontSize: '10px', color: msg.role === 'user' ? '#bfdbfe' : '#9ca3af', marginBottom: '4px' }}>
                  {msg.role === 'user' ? 'あなた' : 'AI'}
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {/* ローディング表示 */}
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                  考え中...
                </div>
              </div>
            </div>
          )}

          {/* 音声再生中表示 */}
          {isSpeaking && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#fef3c7',
                  fontSize: '12px',
                  color: '#92400e',
                }}
              >
                🔊 AIが話しています...
              </div>
            </div>
          )}

          {/* ユーザー発話中表示 */}
          {isUserSpeaking && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#dbeafe',
                  fontSize: '12px',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isRecording ? '#ef4444' : '#9ca3af',
                    animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                  }}
                />
                🎤 {hasSpeechStarted ? '話し終わると自動送信...' : 'お話しください'}
              </div>
            </div>
          )}

          {/* 文字起こし中表示 */}
          {isProcessing && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#e5e7eb',
                  fontSize: '12px',
                  color: '#4b5563',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                ⏳ 文字起こし中...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
