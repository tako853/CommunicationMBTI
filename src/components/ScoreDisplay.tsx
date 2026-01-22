'use client';

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

// テーマカラー
const theme = {
  primary: '#e24f29',      // オレンジレッド（アクセント）
  secondary: '#63a4a6',    // ティールグリーン（サブカラー）
  brown: '#7d6456',        // ブラウン（テキスト）
  primaryLight: '#fef2ef', // プライマリの薄い背景
  secondaryLight: '#f0f7f7', // セカンダリの薄い背景
  brownLight: '#f7f5f4',   // ブラウンの薄い背景
};

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
  const dominantEmotion = currentExpressions
    ? getDominantExpression(currentExpressions)
    : null;

  const scoreItems = [
    { label: '表情', value: scores.expressiveness },
    { label: 'ジェスチャー', value: scores.gestureActivity },
    { label: '姿勢', value: scores.posturalOpenness },
    { label: '視線', value: scores.eyeContact },
    { label: '頷き', value: scores.nodding },
  ];

  return (
    <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'white', border: `1px solid ${theme.brown}20` }}>
      {/* ヘッダー */}
      <div className="px-4 py-3" style={{ backgroundColor: theme.secondaryLight }}>
        <span className="text-sm font-medium" style={{ color: theme.brown }}>リアルタイムスコア</span>
      </div>

      {/* スコアバー（常に表示） */}
      <div className="p-4" style={{ borderTop: `1px solid ${theme.secondary}30` }}>
        <div className="grid grid-cols-5 gap-3">
          {scoreItems.map((item) => (
            <div key={item.label} className="text-center">
              <div
                className="text-2xl font-bold mb-1"
                style={{ color: theme.secondary }}
              >
                {item.value}
              </div>
              <div className="text-xs mb-2" style={{ color: theme.brown }}>{item.label}</div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${theme.brown}20` }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(item.value, 100)}%`, backgroundColor: theme.secondary }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 詳細データ（折りたたみ可能なセクション） */}
        <details className="group mt-4">
          <summary className="text-sm font-medium cursor-pointer flex items-center gap-2" style={{ color: theme.brown }}>
            <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            詳細データを見る
          </summary>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 表情 */}
            <div className="rounded-lg p-3" style={{ backgroundColor: theme.brownLight, border: `1px solid ${theme.brown}15` }}>
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: `${theme.brown}99` }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary }} />
                表情
              </h4>
              {currentExpressions ? (
                <div className="space-y-1">
                  <div className="text-sm font-medium" style={{ color: theme.brown }}>
                    {emotionLabels[dominantEmotion!]}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(currentExpressions).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'white', color: theme.brown }}
                      >
                        {emotionLabels[key]}: {(value * 100).toFixed(0)}%
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="text-xs" style={{ color: `${theme.brown}60` }}>検出なし</span>
              )}
            </div>

            {/* 顔の向き */}
            <div className="rounded-lg p-3" style={{ backgroundColor: theme.brownLight, border: `1px solid ${theme.brown}15` }}>
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: `${theme.brown}99` }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.secondary }} />
                顔の向き
              </h4>
              {currentHeadPose ? (
                <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: theme.brown }}>
                  <span style={{ color: `${theme.brown}80` }}>上下:</span>
                  <span className="text-right">{currentHeadPose.pitch.toFixed(2)}</span>
                  <span style={{ color: `${theme.brown}80` }}>左右:</span>
                  <span className="text-right">{currentHeadPose.yaw.toFixed(2)}</span>
                  <span style={{ color: `${theme.brown}80` }}>傾き:</span>
                  <span className="text-right">{currentHeadPose.roll.toFixed(2)}</span>
                  <span style={{ color: `${theme.brown}80` }}>頷き:</span>
                  <span className="text-right font-medium" style={{ color: currentHeadPose.isNodding ? theme.secondary : `${theme.brown}60` }}>
                    {currentHeadPose.isNodding ? 'Yes' : 'No'}
                  </span>
                </div>
              ) : (
                <span className="text-xs" style={{ color: `${theme.brown}60` }}>検出なし</span>
              )}
            </div>

            {/* 視線 */}
            <div className="rounded-lg p-3" style={{ backgroundColor: theme.brownLight, border: `1px solid ${theme.brown}15` }}>
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: `${theme.brown}99` }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.secondary }} />
                視線
              </h4>
              {currentGaze ? (
                <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: theme.brown }}>
                  <span style={{ color: `${theme.brown}80` }}>カメラ注視:</span>
                  <span className="text-right font-medium" style={{ color: currentGaze.lookingAtCamera ? theme.secondary : `${theme.brown}60` }}>
                    {currentGaze.lookingAtCamera ? 'Yes' : 'No'}
                  </span>
                  <span style={{ color: `${theme.brown}80` }}>目の開き(左):</span>
                  <span className="text-right">{(currentGaze.eyeOpenness.left * 100).toFixed(0)}%</span>
                  <span style={{ color: `${theme.brown}80` }}>目の開き(右):</span>
                  <span className="text-right">{(currentGaze.eyeOpenness.right * 100).toFixed(0)}%</span>
                </div>
              ) : (
                <span className="text-xs" style={{ color: `${theme.brown}60` }}>検出なし</span>
              )}
            </div>

            {/* 手の形状 */}
            <div className="rounded-lg p-3" style={{ backgroundColor: theme.brownLight, border: `1px solid ${theme.brown}15` }}>
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: `${theme.brown}99` }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.secondary }} />
                手の形状
              </h4>
              {currentHandShape && (currentHandShape.left || currentHandShape.right) ? (
                <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: theme.brown }}>
                  <span style={{ color: `${theme.brown}80` }}>左手:</span>
                  <span className="text-right">{getHandShapeLabel(currentHandShape.left)}</span>
                  <span style={{ color: `${theme.brown}80` }}>右手:</span>
                  <span className="text-right">{getHandShapeLabel(currentHandShape.right)}</span>
                </div>
              ) : (
                <span className="text-xs" style={{ color: `${theme.brown}60` }}>検出なし</span>
              )}
            </div>

            {/* 姿勢 */}
            <div className="rounded-lg p-3" style={{ backgroundColor: theme.brownLight, border: `1px solid ${theme.brown}15` }}>
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: `${theme.brown}99` }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.secondary }} />
                姿勢
              </h4>
              {currentPose ? (
                <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: theme.brown }}>
                  <span style={{ color: `${theme.brown}80` }}>肩の開き:</span>
                  <span className="text-right">{(currentPose.shoulderOpenness * 100).toFixed(0)}%</span>
                  <span style={{ color: `${theme.brown}80` }}>前傾/後傾:</span>
                  <span className="text-right">{currentPose.leanAngle.toFixed(2)}</span>
                  <span style={{ color: `${theme.brown}80` }}>安定性:</span>
                  <span className="text-right">{(currentPose.stability * 100).toFixed(0)}%</span>
                </div>
              ) : (
                <span className="text-xs" style={{ color: `${theme.brown}60` }}>検出なし</span>
              )}
            </div>

            {/* ジェスチャー */}
            <div className="rounded-lg p-3" style={{ backgroundColor: theme.brownLight, border: `1px solid ${theme.brown}15` }}>
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: `${theme.brown}99` }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary }} />
                ジェスチャー
              </h4>
              {currentGesture ? (
                <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: theme.brown }}>
                  <span style={{ color: `${theme.brown}80` }}>左手の動き:</span>
                  <span className="text-right">{(currentGesture.leftHandMovement * 100).toFixed(0)}%</span>
                  <span style={{ color: `${theme.brown}80` }}>右手の動き:</span>
                  <span className="text-right">{(currentGesture.rightHandMovement * 100).toFixed(0)}%</span>
                  <span style={{ color: `${theme.brown}80` }}>頻度:</span>
                  <span className="text-right">{(currentGesture.gestureFrequency * 100).toFixed(0)}%</span>
                </div>
              ) : (
                <span className="text-xs" style={{ color: `${theme.brown}60` }}>検出なし</span>
              )}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
