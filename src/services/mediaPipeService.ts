import type {
  PoseData,
  GestureData,
  HeadPoseData,
  GazeData,
  HandShapeData,
  HandShape,
  BodyMovementData,
} from '../types/analysis';

// MediaPipe の型定義
interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface MediaPipeResults {
  poseLandmarks?: NormalizedLandmark[];
  faceLandmarks?: NormalizedLandmark[];
  leftHandLandmarks?: NormalizedLandmark[];
  rightHandLandmarks?: NormalizedLandmark[];
}

type Results = MediaPipeResults;

interface HolisticInstance {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: Results) => void) => void;
  initialize: () => Promise<void>;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let holistic: HolisticInstance | null = null;
let lastLeftHandPos: { x: number; y: number } | null = null;
let lastRightHandPos: { x: number; y: number } | null = null;
let lastBodyCenter: { x: number; y: number } | null = null;
let lastPitchValues: number[] = [];
let onResultsCallback: ((results: Results) => void) | null = null;

export async function initMediaPipe(): Promise<void> {
  // 動的インポートでMediaPipeを読み込む（Next.js SSR対応）
  const { Holistic } = await import('@mediapipe/holistic');

  holistic = new Holistic({
    locateFile: (file: string) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
  }) as HolisticInstance;

  holistic.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  holistic.onResults((results: Results) => {
    if (onResultsCallback) {
      onResultsCallback(results);
    }
  });

  // モデルの初期化を待つ
  await holistic.initialize();
}

export function setOnResultsCallback(callback: (results: Results) => void) {
  onResultsCallback = callback;
}

export async function processFrame(video: HTMLVideoElement): Promise<void> {
  if (!holistic) return;
  await holistic.send({ image: video });
}

// 姿勢データ抽出
export function extractPoseData(results: Results): PoseData | null {
  if (!results.poseLandmarks) return null;

  const landmarks = results.poseLandmarks;

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const shoulderOpenness = Math.min(shoulderWidth * 2, 1);

  const nose = landmarks[0];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const hipCenter = {
    x: (leftHip.x + rightHip.x) / 2,
    z: (leftHip.z + rightHip.z) / 2,
  };

  const leanAngle = Math.max(-1, Math.min(1, (hipCenter.z - nose.z) * 5));

  const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
  const stability = Math.max(0, 1 - shoulderTilt * 5);

  return {
    shoulderOpenness,
    leanAngle,
    stability,
  };
}

// ジェスチャーデータ抽出
export function extractGestureData(results: Results): GestureData | null {
  let leftHandMovement = 0;
  let rightHandMovement = 0;

  if (results.leftHandLandmarks && results.leftHandLandmarks.length > 0) {
    const wrist = results.leftHandLandmarks[0];
    if (lastLeftHandPos) {
      const dx = wrist.x - lastLeftHandPos.x;
      const dy = wrist.y - lastLeftHandPos.y;
      leftHandMovement = Math.min(Math.sqrt(dx * dx + dy * dy) * 10, 1);
    }
    lastLeftHandPos = { x: wrist.x, y: wrist.y };
  } else {
    lastLeftHandPos = null;
  }

  if (results.rightHandLandmarks && results.rightHandLandmarks.length > 0) {
    const wrist = results.rightHandLandmarks[0];
    if (lastRightHandPos) {
      const dx = wrist.x - lastRightHandPos.x;
      const dy = wrist.y - lastRightHandPos.y;
      rightHandMovement = Math.min(Math.sqrt(dx * dx + dy * dy) * 10, 1);
    }
    lastRightHandPos = { x: wrist.x, y: wrist.y };
  } else {
    lastRightHandPos = null;
  }

  const gestureFrequency = (leftHandMovement + rightHandMovement) / 2;

  return {
    leftHandMovement,
    rightHandMovement,
    gestureFrequency,
  };
}

// 顔の向き・頷き検出
export function extractHeadPoseData(results: Results): HeadPoseData | null {
  if (!results.faceLandmarks || results.faceLandmarks.length === 0) return null;

  const landmarks = results.faceLandmarks;

  // 顔の主要ポイント
  const noseTip = landmarks[4]; // 鼻先
  const foreHead = landmarks[10]; // 額
  const leftEar = landmarks[234]; // 左耳
  const rightEar = landmarks[454]; // 右耳

  // Pitch (頷き) - 鼻と顎の相対位置
  const pitch = Math.max(-1, Math.min(1, (noseTip.y - foreHead.y) * 5 - 0.5));

  // Yaw (首振り) - 左右の耳と鼻の相対位置
  const earCenter = (leftEar.x + rightEar.x) / 2;
  const yaw = Math.max(-1, Math.min(1, (noseTip.x - earCenter) * 10));

  // Roll (首かしげ) - 左右の耳の高さの差
  const roll = Math.max(-1, Math.min(1, (leftEar.y - rightEar.y) * 5));

  // 頷き検出 (pitchの変化を追跡)
  lastPitchValues.push(pitch);
  if (lastPitchValues.length > 10) lastPitchValues.shift();

  let isNodding = false;
  if (lastPitchValues.length >= 5) {
    const recentChange = Math.abs(
      lastPitchValues[lastPitchValues.length - 1] -
        lastPitchValues[lastPitchValues.length - 5]
    );
    isNodding = recentChange > 0.3;
  }

  return {
    pitch,
    yaw,
    roll,
    isNodding,
  };
}

// 視線データ抽出
export function extractGazeData(results: Results): GazeData | null {
  if (!results.faceLandmarks || results.faceLandmarks.length === 0) return null;

  const landmarks = results.faceLandmarks;

  // 目のランドマーク
  const leftEyeInner = landmarks[133];
  const leftEyeOuter = landmarks[33];
  const leftEyeTop = landmarks[159];
  const leftEyeBottom = landmarks[145];
  const leftIris = landmarks[468]; // 左虹彩中心

  const rightEyeInner = landmarks[362];
  const rightEyeOuter = landmarks[263];
  const rightEyeTop = landmarks[386];
  const rightEyeBottom = landmarks[374];
  const rightIris = landmarks[473]; // 右虹彩中心

  // 目の開き具合
  const leftEyeHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
  const rightEyeHeight = Math.abs(rightEyeTop.y - rightEyeBottom.y);
  const leftOpenness = Math.min(leftEyeHeight * 20, 1);
  const rightOpenness = Math.min(rightEyeHeight * 20, 1);

  // 視線方向 (虹彩位置から推定)
  const leftEyeCenter = {
    x: (leftEyeInner.x + leftEyeOuter.x) / 2,
    y: (leftEyeTop.y + leftEyeBottom.y) / 2,
  };
  const rightEyeCenter = {
    x: (rightEyeInner.x + rightEyeOuter.x) / 2,
    y: (rightEyeTop.y + rightEyeBottom.y) / 2,
  };

  let gazeX = 0;
  let gazeY = 0;

  if (leftIris && rightIris) {
    const leftGazeX = (leftIris.x - leftEyeCenter.x) * 10;
    const leftGazeY = (leftIris.y - leftEyeCenter.y) * 10;
    const rightGazeX = (rightIris.x - rightEyeCenter.x) * 10;
    const rightGazeY = (rightIris.y - rightEyeCenter.y) * 10;

    gazeX = Math.max(-1, Math.min(1, (leftGazeX + rightGazeX) / 2));
    gazeY = Math.max(-1, Math.min(1, (leftGazeY + rightGazeY) / 2));
  }

  // カメラを見ているか判定
  const lookingAtCamera =
    Math.abs(gazeX) < 0.3 && Math.abs(gazeY) < 0.3 && leftOpenness > 0.3;

  return {
    lookingAtCamera,
    gazeDirection: { x: gazeX, y: gazeY },
    eyeOpenness: { left: leftOpenness, right: rightOpenness },
  };
}

// 指が伸びているか判定
function isFingerExtended(
  landmarks: NormalizedLandmark[],
  fingerTip: number,
  fingerPip: number,
  fingerMcp: number
): boolean {
  const tip = landmarks[fingerTip];
  const pip = landmarks[fingerPip];
  const mcp = landmarks[fingerMcp];

  // 指先がPIPより上（Y座標が小さい）なら伸びている
  return tip.y < pip.y && pip.y < mcp.y;
}

// 単一の手の形状を分析
function analyzeHandShape(landmarks: NormalizedLandmark[]): HandShape {
  // 各指の伸び具合を判定
  const thumbExtended = isFingerExtended(landmarks, 4, 3, 2);
  const indexExtended = isFingerExtended(landmarks, 8, 6, 5);
  const middleExtended = isFingerExtended(landmarks, 12, 10, 9);
  const ringExtended = isFingerExtended(landmarks, 16, 14, 13);
  const pinkyExtended = isFingerExtended(landmarks, 20, 18, 17);

  const fingerCount =
    (thumbExtended ? 1 : 0) +
    (indexExtended ? 1 : 0) +
    (middleExtended ? 1 : 0) +
    (ringExtended ? 1 : 0) +
    (pinkyExtended ? 1 : 0);

  const isOpen = fingerCount >= 4;
  const isFist = fingerCount <= 1;
  const isPeace = indexExtended && middleExtended && !ringExtended && !pinkyExtended;
  const isPointing = indexExtended && !middleExtended && !ringExtended && !pinkyExtended;
  const isThumbUp = thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended;

  return {
    isOpen,
    isFist,
    isPeace,
    isPointing,
    isThumbUp,
    fingerCount,
  };
}

// 手の形状データ抽出
export function extractHandShapeData(results: Results): HandShapeData {
  const left =
    results.leftHandLandmarks && results.leftHandLandmarks.length > 0
      ? analyzeHandShape(results.leftHandLandmarks)
      : null;

  const right =
    results.rightHandLandmarks && results.rightHandLandmarks.length > 0
      ? analyzeHandShape(results.rightHandLandmarks)
      : null;

  return { left, right };
}

// 体の動きデータ抽出
export function extractBodyMovementData(results: Results): BodyMovementData | null {
  if (!results.poseLandmarks) return null;

  const landmarks = results.poseLandmarks;

  // 腕の上げ具合
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];

  // 腕が上がっているか (肩より手首が上ならば)
  const leftArmRaised = Math.max(0, Math.min(1, (leftShoulder.y - leftWrist.y) * 3));
  const rightArmRaised = Math.max(0, Math.min(1, (rightShoulder.y - rightWrist.y) * 3));

  // 体の傾き
  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };
  const hipCenter = {
    x: (landmarks[23].x + landmarks[24].x) / 2,
    y: (landmarks[23].y + landmarks[24].y) / 2,
  };

  const lateral = Math.max(-1, Math.min(1, (shoulderCenter.x - hipCenter.x) * 10));
  const forward = Math.max(-1, Math.min(1, (landmarks[0].z - hipCenter.y) * 5));

  // 体の揺れ (体の中心位置の変化)
  const currentBodyCenter = {
    x: shoulderCenter.x,
    y: shoulderCenter.y,
  };

  let bodySway = 0;
  if (lastBodyCenter) {
    const dx = currentBodyCenter.x - lastBodyCenter.x;
    const dy = currentBodyCenter.y - lastBodyCenter.y;
    bodySway = Math.min(Math.sqrt(dx * dx + dy * dy) * 20, 1);
  }
  lastBodyCenter = currentBodyCenter;

  return {
    armPosition: {
      leftArmRaised,
      rightArmRaised,
    },
    bodyLean: {
      lateral,
      forward,
    },
    bodySway,
  };
}
