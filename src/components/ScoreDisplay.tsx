'use client';

import { useState } from 'react';
import type {
  CommunicationScores,
  ExpressionData,
  PoseData,
  GestureData,
  HeadPoseData,
  GazeData,
  HandShapeData,
  BodyMovementData,
} from '../types/analysis';
import { getDominantExpression } from '../services/faceApiService';

interface ScoreDisplayProps {
  scores: CommunicationScores;
  currentExpressions: ExpressionData | null;
  currentPose: PoseData | null;
  currentGesture: GestureData | null;
  currentHeadPose: HeadPoseData | null;
  currentGaze: GazeData | null;
  currentHandShape: HandShapeData | null;
  currentBodyMovement: BodyMovementData | null;
}

const emotionLabels: Record<string, string> = {
  neutral: '無表情',
  happy: '喜び',
  sad: '悲しみ',
  angry: '怒り',
  fearful: '恐れ',
  disgusted: '嫌悪',
  surprised: '驚き',
};

function MiniScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden flex-1">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

function getHandShapeLabel(hand: { isOpen: boolean; isFist: boolean; isPeace: boolean; isPointing: boolean; isThumbUp: boolean; fingerCount: number } | null): string {
  if (!hand) return '-';
  if (hand.isThumbUp) return 'サムズアップ';
  if (hand.isPeace) return 'ピース';
  if (hand.isPointing) return '指さし';
  if (hand.isFist) return 'グー';
  if (hand.isOpen) return 'パー';
  return `${hand.fingerCount}本`;
}

export function ScoreDisplay({
  scores,
  currentExpressions,
  currentPose,
  currentGesture,
  currentHeadPose,
  currentGaze,
  currentHandShape,
  currentBodyMovement,
}: ScoreDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dominantEmotion = currentExpressions
    ? getDominantExpression(currentExpressions)
    : null;

  const scoreItems = [
    { label: '表情', value: scores.expressiveness, color: '#f59e0b' },
    { label: 'ジェスチャー', value: scores.gestureActivity, color: '#10b981' },
    { label: '姿勢', value: scores.posturalOpenness, color: '#3b82f6' },
    { label: '視線', value: scores.eyeContact, color: '#8b5cf6' },
    { label: '頷き', value: scores.nodding, color: '#ec4899' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* コンパクトヘッダー（常に表示） */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">リアルタイムスコア</span>
          {/* ミニスコアバー表示 */}
          <div className="hidden sm:flex items-center gap-2">
            {scoreItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400 w-12">{item.label}</span>
                <div className="w-16">
                  <MiniScoreBar value={item.value} color={item.color} />
                </div>
                <span className="text-xs font-medium w-8" style={{ color: item.color }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 展開時の詳細表示 */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
          {/* スコアバー（大きく表示） */}
          <div className="grid grid-cols-5 gap-3">
            {scoreItems.map((item) => (
              <div key={item.label} className="text-center">
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ color: item.color }}
                >
                  {item.value}
                </div>
                <div className="text-xs text-gray-500 mb-2">{item.label}</div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(item.value, 100)}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 詳細データ（折りたたみ可能なセクション） */}
          <details className="group">
            <summary className="text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800 flex items-center gap-2">
              <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              詳細データを見る
            </summary>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* 表情 */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-500 rounded-full" />
                  表情
                </h4>
                {currentExpressions ? (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-800">
                      {emotionLabels[dominantEmotion!]}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(currentExpressions).map(([key, value]) => (
                        <span
                          key={key}
                          className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600"
                        >
                          {emotionLabels[key]}: {(value * 100).toFixed(0)}%
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">検出なし</span>
                )}
              </div>

              {/* 顔の向き */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  顔の向き
                </h4>
                {currentHeadPose ? (
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span className="text-gray-500">上下:</span>
                    <span className="text-right">{currentHeadPose.pitch.toFixed(2)}</span>
                    <span className="text-gray-500">左右:</span>
                    <span className="text-right">{currentHeadPose.yaw.toFixed(2)}</span>
                    <span className="text-gray-500">傾き:</span>
                    <span className="text-right">{currentHeadPose.roll.toFixed(2)}</span>
                    <span className="text-gray-500">頷き:</span>
                    <span className={`text-right font-medium ${currentHeadPose.isNodding ? 'text-green-600' : 'text-gray-400'}`}>
                      {currentHeadPose.isNodding ? 'Yes' : 'No'}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">検出なし</span>
                )}
              </div>

              {/* 視線 */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full" />
                  視線
                </h4>
                {currentGaze ? (
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span className="text-gray-500">カメラ注視:</span>
                    <span className={`text-right font-medium ${currentGaze.lookingAtCamera ? 'text-green-600' : 'text-gray-400'}`}>
                      {currentGaze.lookingAtCamera ? 'Yes' : 'No'}
                    </span>
                    <span className="text-gray-500">目の開き(左):</span>
                    <span className="text-right">{(currentGaze.eyeOpenness.left * 100).toFixed(0)}%</span>
                    <span className="text-gray-500">目の開き(右):</span>
                    <span className="text-right">{(currentGaze.eyeOpenness.right * 100).toFixed(0)}%</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">検出なし</span>
                )}
              </div>

              {/* 手の形状 */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  手の形状
                </h4>
                {currentHandShape && (currentHandShape.left || currentHandShape.right) ? (
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span className="text-gray-500">左手:</span>
                    <span className="text-right">{getHandShapeLabel(currentHandShape.left)}</span>
                    <span className="text-gray-500">右手:</span>
                    <span className="text-right">{getHandShapeLabel(currentHandShape.right)}</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">検出なし</span>
                )}
              </div>

              {/* 姿勢 */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full" />
                  姿勢
                </h4>
                {currentPose ? (
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span className="text-gray-500">肩の開き:</span>
                    <span className="text-right">{(currentPose.shoulderOpenness * 100).toFixed(0)}%</span>
                    <span className="text-gray-500">前傾/後傾:</span>
                    <span className="text-right">{currentPose.leanAngle.toFixed(2)}</span>
                    <span className="text-gray-500">安定性:</span>
                    <span className="text-right">{(currentPose.stability * 100).toFixed(0)}%</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">検出なし</span>
                )}
              </div>

              {/* ジェスチャー */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-pink-500 rounded-full" />
                  ジェスチャー
                </h4>
                {currentGesture ? (
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span className="text-gray-500">左手の動き:</span>
                    <span className="text-right">{(currentGesture.leftHandMovement * 100).toFixed(0)}%</span>
                    <span className="text-gray-500">右手の動き:</span>
                    <span className="text-right">{(currentGesture.rightHandMovement * 100).toFixed(0)}%</span>
                    <span className="text-gray-500">頻度:</span>
                    <span className="text-right">{(currentGesture.gestureFrequency * 100).toFixed(0)}%</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">検出なし</span>
                )}
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
