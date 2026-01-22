'use client';

import { CommunicationType, CommunicationAxisScores, CommunicationScores } from '../types/analysis';
import { getTypeInfo } from '../data/communicationTypes';

interface ResultDisplayProps {
  type: CommunicationType;
  scores: CommunicationAxisScores;
  detailScores?: CommunicationScores;
  personalizedComment?: string | null;
  isLoadingComment?: boolean;
}

const axisLabels = {
  assertiveness: {
    high: 'Assert',
    highSub: '主張型',
    low: 'Reserved',
    lowSub: '省察型',
    name: '伝える力',
    color: '#3b82f6',
  },
  listening: {
    high: 'Connect',
    highSub: '共鳴型',
    low: 'Distill',
    lowSub: '要点抽出型',
    name: '聞く力',
    color: '#10b981',
  },
  nonverbalExpression: {
    high: 'Faceful',
    highSub: '表情型',
    low: 'Subtle',
    lowSub: '気配型',
    name: '非言語を伝える力',
    color: '#f59e0b',
  },
  nonverbalReading: {
    high: 'Perceptive',
    highSub: '察知型',
    low: 'Tell-me',
    lowSub: '明示待ち型',
    name: '非言語を読み取る力',
    color: '#8b5cf6',
  },
};

export const ResultDisplay = ({
  type,
  scores,
  detailScores,
  personalizedComment,
  isLoadingComment,
}: ResultDisplayProps) => {
  const typeInfo = getTypeInfo(type);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* ヘッダー: タイプ画像とタイトル */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 mb-6 shadow-sm">
        <h2 className="text-center text-gray-600 text-sm font-medium mb-4">
          あなたのコミュニケーションタイプ
        </h2>

        {/* タイプ画像 */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <img
              src={typeInfo.imagePath}
              alt={typeInfo.type}
              className="w-48 h-48 object-contain rounded-xl shadow-lg bg-white p-2"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* タイプコードと名前 */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-md">
            <span className="text-3xl font-black text-indigo-600 tracking-wider">
              {typeInfo.type}
            </span>
            <span className="text-lg font-medium text-gray-700">
              {typeInfo.name}
            </span>
          </div>
        </div>

        {/* 説明 */}
        {typeInfo.description && (
          <p className="mt-4 text-center text-gray-600 leading-relaxed">
            {typeInfo.description}
          </p>
        )}
      </div>

      {/* パーソナライズコメント（吹き出し風） */}
      {(personalizedComment || isLoadingComment) && (
        <div className="mb-6">
          <div className="relative bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl p-5 border border-sky-200 shadow-sm">
            {/* 吹き出しの三角形 */}
            <div className="absolute -top-3 left-8 w-6 h-6 bg-gradient-to-br from-sky-50 to-blue-50 border-l border-t border-sky-200 transform rotate-45" />

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white text-lg">
                AI
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-sm font-semibold text-sky-700 mb-2">
                  あなたへのコメント
                </h3>
                {isLoadingComment ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="ml-2 text-sm">コメントを生成中...</span>
                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed">{personalizedComment}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4軸のスコア */}
      <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-indigo-500 rounded-full" />
          各軸のスコア
        </h3>
        <div className="space-y-5">
          {(Object.keys(scores) as (keyof CommunicationAxisScores)[]).map((axis) => {
            const label = axisLabels[axis];
            const score = scores[axis];
            return (
              <div key={axis}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">{label.name}</span>
                  <span
                    className="text-sm font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${label.color}20`, color: label.color }}
                  >
                    {score}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <span className="flex-shrink-0 w-20 text-right">
                    <span className="font-medium">{label.low}</span>
                    <span className="text-gray-400 ml-1">({label.lowSub})</span>
                  </span>
                  <div className="flex-1" />
                  <span className="flex-shrink-0 w-20">
                    <span className="font-medium">{label.high}</span>
                    <span className="text-gray-400 ml-1">({label.highSub})</span>
                  </span>
                </div>
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${score}%`,
                      background: `linear-gradient(90deg, ${label.color}80, ${label.color})`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 transition-all duration-500 ease-out"
                    style={{
                      left: `${score}%`,
                      transform: 'translate(-50%, -50%)',
                      borderColor: label.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 強みと注意点（2カラム） */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 強み */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-200">
          <h3 className="text-lg font-bold text-emerald-700 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            強み
          </h3>
          <ul className="space-y-2">
            {typeInfo.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="flex-shrink-0 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 注意点 */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
          <h3 className="text-lg font-bold text-amber-700 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            注意点
          </h3>
          <ul className="space-y-2">
            {typeInfo.cautions.map((caution, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="flex-shrink-0 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{caution}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 詳細スコア（オプション表示） */}
      {detailScores && (
        <details className="mt-6 bg-gray-50 rounded-2xl border border-gray-200">
          <summary className="px-5 py-3 cursor-pointer text-gray-600 font-medium hover:bg-gray-100 rounded-2xl transition-colors">
            詳細スコアを見る
          </summary>
          <div className="px-5 pb-4 pt-2 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">表情の豊かさ</span>
                <span className="font-medium">{detailScores.expressiveness}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ジェスチャー</span>
                <span className="font-medium">{detailScores.gestureActivity}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">姿勢の開放性</span>
                <span className="font-medium">{detailScores.posturalOpenness}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">アイコンタクト</span>
                <span className="font-medium">{detailScores.eyeContact}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">頷き</span>
                <span className="font-medium">{detailScores.nodding}%</span>
              </div>
            </div>
          </div>
        </details>
      )}
    </div>
  );
};
