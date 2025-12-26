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

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-bar">
      <div className="score-label">
        <span>{label}</span>
        <span>{typeof value === 'number' ? value.toFixed(0) : value}</span>
      </div>
      <div className="score-track">
        <div
          className="score-fill"
          style={{ width: `${Math.min(value, 100)}%` }}
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

      <DataSection title="顔の向き (MediaPipe)">
        {currentHeadPose ? (
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">上下 (Pitch)</span>
              <span className="detail-value">{currentHeadPose.pitch.toFixed(2)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">左右 (Yaw)</span>
              <span className="detail-value">{currentHeadPose.yaw.toFixed(2)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">傾き (Roll)</span>
              <span className="detail-value">{currentHeadPose.roll.toFixed(2)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">頷き検出</span>
              <span className="detail-value">{currentHeadPose.isNodding ? 'Yes' : 'No'}</span>
            </div>
          </div>
        ) : (
          <div className="no-data">顔が検出されていません</div>
        )}
      </DataSection>

      <DataSection title="視線 (MediaPipe)">
        {currentGaze ? (
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">カメラ注視</span>
              <span className="detail-value">{currentGaze.lookingAtCamera ? 'Yes' : 'No'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">視線X</span>
              <span className="detail-value">{currentGaze.gazeDirection.x.toFixed(2)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">視線Y</span>
              <span className="detail-value">{currentGaze.gazeDirection.y.toFixed(2)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">目の開き(左)</span>
              <span className="detail-value">{(currentGaze.eyeOpenness.left * 100).toFixed(0)}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">目の開き(右)</span>
              <span className="detail-value">{(currentGaze.eyeOpenness.right * 100).toFixed(0)}%</span>
            </div>
          </div>
        ) : (
          <div className="no-data">視線が検出されていません</div>
        )}
      </DataSection>

      <DataSection title="手の形状 (MediaPipe)">
        {currentHandShape && (currentHandShape.left || currentHandShape.right) ? (
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">左手</span>
              <span className="detail-value">{getHandShapeLabel(currentHandShape.left)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">右手</span>
              <span className="detail-value">{getHandShapeLabel(currentHandShape.right)}</span>
            </div>
            {currentHandShape.left && (
              <div className="detail-item">
                <span className="detail-label">左手指数</span>
                <span className="detail-value">{currentHandShape.left.fingerCount}本</span>
              </div>
            )}
            {currentHandShape.right && (
              <div className="detail-item">
                <span className="detail-label">右手指数</span>
                <span className="detail-value">{currentHandShape.right.fingerCount}本</span>
              </div>
            )}
          </div>
        ) : (
          <div className="no-data">手が検出されていません</div>
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

      <DataSection title="体の動き (MediaPipe)">
        {currentBodyMovement ? (
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">左腕上げ</span>
              <span className="detail-value">{(currentBodyMovement.armPosition.leftArmRaised * 100).toFixed(0)}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">右腕上げ</span>
              <span className="detail-value">{(currentBodyMovement.armPosition.rightArmRaised * 100).toFixed(0)}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">左右傾き</span>
              <span className="detail-value">{currentBodyMovement.bodyLean.lateral.toFixed(2)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">前後傾き</span>
              <span className="detail-value">{currentBodyMovement.bodyLean.forward.toFixed(2)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">体の揺れ</span>
              <span className="detail-value">{(currentBodyMovement.bodySway * 100).toFixed(0)}%</span>
            </div>
          </div>
        ) : (
          <div className="no-data">体が検出されていません</div>
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
