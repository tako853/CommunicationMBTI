import type {
  CommunicationScores,
  ExpressionData,
  PoseData,
  GestureData,
} from '../types/analysis';
import { getDominantExpression } from '../services/faceApiService';

interface ScoreDisplayProps {
  scores: CommunicationScores;
  currentExpressions: ExpressionData | null;
  currentPose: PoseData | null;
  currentGesture: GestureData | null;
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

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const percentage = (value / max) * 100;
  return (
    <div className="score-bar">
      <div className="score-label">
        <span>{label}</span>
        <span>{typeof value === 'number' ? value.toFixed(2) : value}</span>
      </div>
      <div className="score-track">
        <div
          className="score-fill"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

function DataSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="data-section">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

export function ScoreDisplay({
  scores,
  currentExpressions,
  currentPose,
  currentGesture,
}: ScoreDisplayProps) {
  const dominantEmotion = currentExpressions
    ? getDominantExpression(currentExpressions)
    : null;

  return (
    <div className="score-display">
      <h3>Communication Scores</h3>

      <div className="scores-container">
        <ScoreBar label="表現力" value={scores.expressiveness} />
        <ScoreBar label="ジェスチャー" value={scores.gestureActivity} />
        <ScoreBar label="姿勢開放性" value={scores.posturalOpenness} />
      </div>

      <DataSection title="表情 (face-api.js)">
        {currentExpressions ? (
          <>
            <div className="current-emotion">
              支配的表情: <strong>{emotionLabels[dominantEmotion!]}</strong>
            </div>
            <div className="detail-grid">
              {Object.entries(currentExpressions).map(([key, value]) => (
                <div key={key} className="detail-item">
                  <span className="detail-label">{emotionLabels[key]}</span>
                  <span className="detail-value">{(value * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-data">顔が検出されていません</div>
        )}
      </DataSection>

      <DataSection title="姿勢 (MediaPipe)">
        {currentPose ? (
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">肩の開き</span>
              <span className="detail-value">{(currentPose.shoulderOpenness * 100).toFixed(1)}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">前傾/後傾</span>
              <span className="detail-value">{currentPose.leanAngle.toFixed(2)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">安定性</span>
              <span className="detail-value">{(currentPose.stability * 100).toFixed(1)}%</span>
            </div>
          </div>
        ) : (
          <div className="no-data">姿勢が検出されていません</div>
        )}
      </DataSection>

      <DataSection title="ジェスチャー (MediaPipe)">
        {currentGesture ? (
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">左手の動き</span>
              <span className="detail-value">{(currentGesture.leftHandMovement * 100).toFixed(1)}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">右手の動き</span>
              <span className="detail-value">{(currentGesture.rightHandMovement * 100).toFixed(1)}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">頻度</span>
              <span className="detail-value">{(currentGesture.gestureFrequency * 100).toFixed(1)}%</span>
            </div>
          </div>
        ) : (
          <div className="no-data">手が検出されていません</div>
        )}
      </DataSection>
    </div>
  );
}
