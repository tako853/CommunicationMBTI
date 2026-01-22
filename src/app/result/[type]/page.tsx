'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ResultDisplay } from '@/components/ResultDisplay';
import { COMMUNICATION_TYPES } from '@/data/communicationTypes';
import { generatePersonalizedComment } from '@/services/personalizedCommentService';
import type { CommunicationType, CommunicationAxisScores, CommunicationScores, AnalysisResultData } from '@/types/analysis';

// デフォルトの軸スコア
const defaultAxisScores: CommunicationAxisScores = {
  assertiveness: 50,
  listening: 50,
  nonverbalExpression: 50,
  nonverbalReading: 50,
};

// デフォルトの詳細スコア
const defaultDetailScores: CommunicationScores = {
  expressiveness: 50,
  gestureActivity: 50,
  posturalOpenness: 50,
  eyeContact: 50,
  nodding: 50,
};

export default function ResultPage() {
  const params = useParams();
  const type = params.type as string;

  const [axisScores, setAxisScores] = useState<CommunicationAxisScores>(defaultAxisScores);
  const [detailScores, setDetailScores] = useState<CommunicationScores>(defaultDetailScores);
  const [personalizedComment, setPersonalizedComment] = useState<string | null>(null);
  const [isLoadingComment, setIsLoadingComment] = useState(false);

  // sessionStorageからデータを取得
  useEffect(() => {
    const stored = sessionStorage.getItem('analysisResult');
    if (stored) {
      try {
        const data: AnalysisResultData = JSON.parse(stored);
        setAxisScores(data.axisScores);
        setDetailScores(data.detailScores);

        // パーソナライズコメントを生成
        setIsLoadingComment(true);
        generatePersonalizedComment(data.type, data.axisScores, data.detailScores)
          .then((comment) => {
            setPersonalizedComment(comment);
          })
          .catch((error) => {
            console.error('Failed to generate personalized comment:', error);
          })
          .finally(() => {
            setIsLoadingComment(false);
          });
      } catch (e) {
        console.error('Failed to parse analysis result:', e);
      }
    }
  }, []);

  // タイプが有効かチェック
  if (!COMMUNICATION_TYPES[type as CommunicationType]) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">タイプが見つかりません</h1>
        <p className="text-gray-600 mb-8">指定されたタイプ「{type}」は存在しません。</p>
        <Link
          href="/"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          トップに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <ResultDisplay
        type={type as CommunicationType}
        scores={axisScores}
        detailScores={detailScores}
        personalizedComment={personalizedComment}
        isLoadingComment={isLoadingComment}
      />

      <div className="max-w-xl mx-auto mt-8 flex gap-4 justify-center">
        <Link
          href="/analysis"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          もう一度診断する
        </Link>
        <Link
          href="/"
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300"
        >
          トップに戻る
        </Link>
      </div>
    </div>
  );
}
