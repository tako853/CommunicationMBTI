'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ResultDisplay } from '@/components/ResultDisplay';
import { COMMUNICATION_TYPES } from '@/data/communicationTypes';
import type { CommunicationType, CommunicationAxisScores } from '@/types/analysis';

export default function ResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const type = params.type as string;

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

  // クエリパラメータからスコアを取得（なければデフォルト50）
  const scores: CommunicationAxisScores = {
    assertiveness: parseInt(searchParams.get('a') || '50', 10),
    listening: parseInt(searchParams.get('l') || '50', 10),
    nonverbalExpression: parseInt(searchParams.get('n') || '50', 10),
    nonverbalReading: parseInt(searchParams.get('r') || '50', 10),
  };

  return (
    <div className="min-h-screen p-4">
      <ResultDisplay type={type as CommunicationType} scores={scores} />

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
