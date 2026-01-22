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

// 共通のテーマカラー（タイプ固有でないもの）
const baseTheme = {
  brown: '#7d6456',        // ブラウン（テキスト）
  brownLight: '#f7f5f4',   // ブラウンの薄い背景
};

// HEXカラーからRGBを取得
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// ベースカラーから薄いバージョンを生成（背景用）
function getLightColor(hex: string, intensity: number = 0.08): string {
  const { r, g, b } = hexToRgb(hex);
  // 白とブレンドして薄い色を作成
  const lightR = Math.round(r + (255 - r) * (1 - intensity));
  const lightG = Math.round(g + (255 - g) * (1 - intensity));
  const lightB = Math.round(b + (255 - b) * (1 - intensity));
  return `rgb(${lightR}, ${lightG}, ${lightB})`;
}

// ベースカラーから暗いバージョンを生成
function getDarkerColor(hex: string, factor: number = 0.2): string {
  const { r, g, b } = hexToRgb(hex);
  const darkerR = Math.round(r * (1 - factor));
  const darkerG = Math.round(g * (1 - factor));
  const darkerB = Math.round(b * (1 - factor));
  return `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
}

const axisLabels = {
  assertiveness: {
    high: 'Assert',
    highSub: '主張型',
    low: 'Reserved',
    lowSub: '省察型',
    name: '伝える力',
  },
  listening: {
    high: 'Connect',
    highSub: '共鳴型',
    low: 'Distill',
    lowSub: '要点抽出型',
    name: '聞く力',
  },
  nonverbalExpression: {
    high: 'Faceful',
    highSub: '表情型',
    low: 'Subtle',
    lowSub: '気配型',
    name: '非言語を伝える力',
  },
  nonverbalReading: {
    high: 'Perceptive',
    highSub: '察知型',
    low: 'Tell-me',
    lowSub: '明示待ち型',
    name: '非言語を読み取る力',
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

  // タイプ固有のカラーからテーマを生成
  const typeColor = typeInfo.color;
  const theme = {
    primary: typeColor,                          // タイプ固有のメインカラー
    primaryLight: getLightColor(typeColor, 0.08), // 薄い背景色
    primaryMedium: getLightColor(typeColor, 0.15), // 少し濃い背景色
    primaryDark: getDarkerColor(typeColor, 0.15), // 濃いアクセント
    brown: baseTheme.brown,
    brownLight: baseTheme.brownLight,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* ヘッダー: タイプ画像とタイトル */}
      <div
        className="rounded-2xl p-6 mb-6 shadow-sm"
        style={{ backgroundColor: theme.primaryLight }}
      >
        <h2 className="text-center text-sm font-medium mb-4" style={{ color: theme.brown }}>
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
            <span
              className="text-3xl font-black tracking-wider"
              style={{ color: theme.primary }}
            >
              {typeInfo.type}
            </span>
            <span className="text-lg font-medium" style={{ color: theme.brown }}>
              {typeInfo.name}
            </span>
          </div>
        </div>

        {/* 説明 */}
        {typeInfo.description && (
          <p className="mt-4 text-center leading-relaxed" style={{ color: theme.brown }}>
            {typeInfo.description}
          </p>
        )}
      </div>

      {/* パーソナライズコメント（吹き出し風） */}
      {(personalizedComment || isLoadingComment) && (
        <div className="mb-6">
          <div
            className="relative rounded-2xl p-5 shadow-sm"
            style={{ backgroundColor: theme.primaryLight, border: `1px solid ${theme.primary}30` }}
          >
            {/* 吹き出しの三角形 */}
            <div
              className="absolute -top-3 left-8 w-6 h-6 transform rotate-45"
              style={{
                backgroundColor: theme.primaryLight,
                borderLeft: `1px solid ${theme.primary}30`,
                borderTop: `1px solid ${theme.primary}30`,
              }}
            />

            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: theme.primary }}
              >
                AI
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-sm font-semibold mb-2" style={{ color: theme.primary }}>
                  あなたへのコメント
                </h3>
                {isLoadingComment ? (
                  <div className="flex items-center gap-2" style={{ color: theme.brown }}>
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: '300ms' }} />
                    <span className="ml-2 text-sm">コメントを生成中...</span>
                  </div>
                ) : (
                  <p className="leading-relaxed" style={{ color: theme.brown }}>{personalizedComment}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4軸のスコア */}
      <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.brown }}>
          <span className="w-1 h-6 rounded-full" style={{ backgroundColor: theme.primary }} />
          各軸のスコア
        </h3>
        <div className="space-y-5">
          {(Object.keys(scores) as (keyof CommunicationAxisScores)[]).map((axis) => {
            const label = axisLabels[axis];
            const score = scores[axis];
            return (
              <div key={axis}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium" style={{ color: theme.brown }}>{label.name}</span>
                  <span
                    className="text-sm font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}
                  >
                    {score}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs mb-1" style={{ color: theme.brown }}>
                  <span className="flex-shrink-0 w-20 text-right">
                    <span className="font-medium">{label.low}</span>
                    <span className="opacity-60 ml-1">({label.lowSub})</span>
                  </span>
                  <div className="flex-1" />
                  <span className="flex-shrink-0 w-20">
                    <span className="font-medium">{label.high}</span>
                    <span className="opacity-60 ml-1">({label.highSub})</span>
                  </span>
                </div>
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${score}%`,
                      background: `linear-gradient(90deg, ${theme.primary}80, ${theme.primary})`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 transition-all duration-500 ease-out"
                    style={{
                      left: `${score}%`,
                      transform: 'translate(-50%, -50%)',
                      borderColor: theme.primary,
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
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: theme.primaryLight, border: `1px solid ${theme.primary}40` }}
        >
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: theme.primary }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            強み
          </h3>
          <ul className="space-y-2">
            {typeInfo.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2" style={{ color: theme.brown }}>
                <span
                  className="flex-shrink-0 w-5 h-5 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ backgroundColor: theme.primary }}
                >
                  {index + 1}
                </span>
                <span className="leading-relaxed">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 注意点 */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: theme.primaryMedium, border: `1px solid ${theme.primary}50` }}
        >
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: theme.primaryDark }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            注意点
          </h3>
          <ul className="space-y-2">
            {typeInfo.cautions.map((caution, index) => (
              <li key={index} className="flex items-start gap-2" style={{ color: theme.brown }}>
                <span
                  className="flex-shrink-0 w-5 h-5 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ backgroundColor: theme.primaryDark }}
                >
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
        <details
          className="mt-6 rounded-2xl"
          style={{ backgroundColor: theme.brownLight, border: `1px solid ${theme.brown}20` }}
        >
          <summary
            className="px-5 py-3 cursor-pointer font-medium rounded-2xl transition-colors hover:opacity-80"
            style={{ color: theme.brown }}
          >
            詳細スコアを見る
          </summary>
          <div className="px-5 pb-4 pt-2" style={{ borderTop: `1px solid ${theme.brown}20` }}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span style={{ color: `${theme.brown}99` }}>表情の豊かさ</span>
                <span className="font-medium" style={{ color: theme.brown }}>{detailScores.expressiveness}%</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: `${theme.brown}99` }}>ジェスチャー</span>
                <span className="font-medium" style={{ color: theme.brown }}>{detailScores.gestureActivity}%</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: `${theme.brown}99` }}>姿勢の開放性</span>
                <span className="font-medium" style={{ color: theme.brown }}>{detailScores.posturalOpenness}%</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: `${theme.brown}99` }}>アイコンタクト</span>
                <span className="font-medium" style={{ color: theme.brown }}>{detailScores.eyeContact}%</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: `${theme.brown}99` }}>頷き</span>
                <span className="font-medium" style={{ color: theme.brown }}>{detailScores.nodding}%</span>
              </div>
            </div>
          </div>
        </details>
      )}
    </div>
  );
};
