import type { CommunicationScores, ExpressionData } from '../types/analysis';
import { getDominantExpression } from '../services/faceApiService';

interface ScoreDisplayProps {
  scores: CommunicationScores;
  currentExpressions: ExpressionData | null;
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
        <span>{value}</span>
      </div>
      <div className="score-track">
        <div
          className="score-fill"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function ScoreDisplay({ scores, currentExpressions }: ScoreDisplayProps) {
  const dominantEmotion = currentExpressions
    ? getDominantExpression(currentExpressions)
    : null;

  return (
    <div className="score-display">
      <h3>Communication Scores</h3>

      {dominantEmotion && (
        <div className="current-emotion">
          現在の表情: <strong>{emotionLabels[dominantEmotion]}</strong>
        </div>
      )}

      <div className="scores-container">
        <ScoreBar label="表現力" value={scores.expressiveness} />
        <ScoreBar label="ジェスチャー" value={scores.gestureActivity} />
        <ScoreBar label="姿勢開放性" value={scores.posturalOpenness} />
      </div>
    </div>
  );
}
