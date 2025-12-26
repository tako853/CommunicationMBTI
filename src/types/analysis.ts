// 表情データ
export interface ExpressionData {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

// 姿勢データ
export interface PoseData {
  shoulderOpenness: number; // 肩の開き具合 0-1
  leanAngle: number; // 前傾/後傾角度 (-1 to 1, 0が直立)
  stability: number; // 姿勢の安定性 0-1
}

// ジェスチャーデータ
export interface GestureData {
  leftHandMovement: number; // 左手の動き量 0-1
  rightHandMovement: number; // 右手の動き量 0-1
  gestureFrequency: number; // ジェスチャー頻度 0-1
}

// タイムラインエントリ
export interface TimelineEntry {
  timestamp: number;
  expressions: ExpressionData | null;
  pose: PoseData | null;
  gesture: GestureData | null;
}

// スコア
export interface CommunicationScores {
  expressiveness: number; // 表現力 0-100
  gestureActivity: number; // ジェスチャー活性度 0-100
  posturalOpenness: number; // 姿勢開放性 0-100
  eyeContactStability?: number; // 視線安定性 0-100 (optional)
}

// サマリー
export interface SessionSummary {
  dominantEmotion: string;
  emotionDistribution: Record<string, number>;
  averageGestureFrequency: number;
  postureStability: number;
}

// セッションデータ（別担当者との連携用）
export interface SessionData {
  sessionId: string;
  startTime: string;
  endTime: string;
  duration: number; // seconds

  timeline: TimelineEntry[];
  scores: CommunicationScores;
  summary: SessionSummary;
}

// 分析状態
export interface AnalysisState {
  isAnalyzing: boolean;
  isModelLoaded: boolean;
  currentExpressions: ExpressionData | null;
  currentPose: PoseData | null;
  currentGesture: GestureData | null;
  error: string | null;
}
