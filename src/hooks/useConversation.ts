'use client';

import { useState, useCallback, useRef } from 'react';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function useConversation() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);

  // 遅延追加用のref
  const pendingAiMessageRef = useRef<{ message: ConversationMessage; userMessages: ConversationMessage[] } | null>(null);

  // 会話を開始（AIが最初に話す）
  // delayAddMessage: trueの場合、メッセージ追加を遅延
  const startConversation = useCallback(async (delayAddMessage?: boolean): Promise<string> => {
    setIsLoading(true);
    setError(null);
    setMessages([]);
    startTimeRef.current = Date.now();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [], isFirstMessage: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '会話の開始に失敗しました');
      }

      const data = await response.json();
      const aiMessage: ConversationMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
      };

      if (delayAddMessage) {
        pendingAiMessageRef.current = { message: aiMessage, userMessages: [] };
      } else {
        setMessages([aiMessage]);
      }
      return data.message;
    } catch (e) {
      const message = e instanceof Error ? e.message : '会話開始エラー';
      setError(message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ユーザーの発言を追加し、AIの返答を取得
  // delayAddMessage: trueの場合、メッセージ追加を遅延し、addPendingMessage()で追加
  const sendMessage = useCallback(async (
    userMessage: string,
    delayAddMessage?: boolean
  ): Promise<string> => {
    if (!userMessage || userMessage.trim().length === 0) {
      return '';
    }

    setIsLoading(true);
    setError(null);

    const userMsg: ConversationMessage = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '返答の取得に失敗しました');
      }

      const data = await response.json();
      const aiMessage: ConversationMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
      };

      if (delayAddMessage) {
        // 遅延追加モード：後でaddPendingMessage()を呼ぶまで追加しない
        pendingAiMessageRef.current = { message: aiMessage, userMessages: updatedMessages };
      } else {
        setMessages([...updatedMessages, aiMessage]);
      }

      return data.message;
    } catch (e) {
      const message = e instanceof Error ? e.message : '会話エラー';
      setError(message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  // 遅延されたAIメッセージを追加
  const addPendingMessage = useCallback(() => {
    if (pendingAiMessageRef.current) {
      const { message, userMessages } = pendingAiMessageRef.current;
      setMessages([...userMessages, message]);
      pendingAiMessageRef.current = null;
    }
  }, []);

  // 会話をリセット
  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    startTimeRef.current = 0;
  }, []);

  // ユーザーの発言のみを取得（スコアリング用）
  const getUserTranscript = useCallback(() => {
    return messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n');
  }, [messages]);

  // 会話時間を取得
  const getDuration = useCallback(() => {
    if (startTimeRef.current === 0) return 0;
    return (Date.now() - startTimeRef.current) / 1000;
  }, []);

  return {
    messages,
    isLoading,
    error,
    startConversation,
    sendMessage,
    addPendingMessage,
    reset,
    getUserTranscript,
    getDuration,
  };
}
