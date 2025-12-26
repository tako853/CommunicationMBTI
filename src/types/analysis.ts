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

// 顔の向きデータ (MediaPipe faceLandmarks)
export interface HeadPoseData {
  pitch: number; // 頷き (-1: 下向き, 0: 正面, 1: 上向き)
  yaw: number; // 首振り (-1: 左, 0: 正面, 1: 右)
  roll: number; // 首かしげ (-1: 左傾き, 0: 正面, 1: 右傾き)
  isNodding: boolean; // 頷き検出
}

// 視線データ (MediaPipe faceLandmarks)
export interface GazeData {
  lookingAtCamera: boolean; // カメラを見ているか
  gazeDirection: { x: number; y: number }; // 視線方向 (-1 to 1)
  eyeOpenness: { left: number; right: number }; // 目の開き具合 0-1
}

// 手の形状データ
export interface HandShapeData {
  left: HandShape | null;
  right: HandShape | null;
}

export interface HandShape {
  isOpen: boolean; // パー
  isFist: boolean; // グー
  isPeace: boolean; // ピース
  isPointing: boolean; // 指さし
  isThumbUp: boolean; // サムズアップ
  fingerCount: number; // 立っている指の数
}

// 姿勢データ (拡張)
export interface PoseData {
  shoulderOpenness: number; // 肩の開き具合 0-1
  leanAngle: number; // 前傾/後傾角度 (-1 to 1, 0が直立)
  stability: number; // 姿勢の安定性 0-1
}

// 体の動きデータ (追加)
export interface BodyMovementData {
  armPosition: {
    leftArmRaised: number; // 左腕の上げ具合 0-1
    rightArmRaised: number; // 右腕の上げ具合 0-1
  };
  bodyLean: {
    lateral: number; // 左右の傾き (-1: 左, 1: 右)
    forward: number; // 前後の傾き (-1: 後ろ, 1: 前)
  };
  bodySway: number; // 体の揺れ 0-1
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
  headPose: HeadPoseData | null;
  gaze: GazeData | null;
  handShape: HandShapeData | null;
  bodyMovement: BodyMovementData | null;
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
