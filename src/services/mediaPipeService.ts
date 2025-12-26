import { Holistic } from '@mediapipe/holistic';
import type { Results } from '@mediapipe/holistic';
import type { PoseData, GestureData } from '../types/analysis';

let holistic: Holistic | null = null;
let lastLeftHandPos: { x: number; y: number } | null = null;
let lastRightHandPos: { x: number; y: number } | null = null;
let onResultsCallback: ((results: Results) => void) | null = null;

export function initMediaPipe(): Promise<void> {
  return new Promise((resolve) => {
    holistic = new Holistic({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    });

    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    holistic.onResults((results) => {
      if (onResultsCallback) {
        onResultsCallback(results);
      }
    });

    resolve();
  });
}

export function setOnResultsCallback(callback: (results: Results) => void) {
  onResultsCallback = callback;
}

export async function processFrame(video: HTMLVideoElement): Promise<void> {
  if (!holistic) return;
  await holistic.send({ image: video });
}

export function extractPoseData(results: Results): PoseData | null {
  if (!results.poseLandmarks) return null;

  const landmarks = results.poseLandmarks;

  // 肩のランドマーク (11: 左肩, 12: 右肩)
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  // 肩の開き具合を計算
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const shoulderOpenness = Math.min(shoulderWidth * 2, 1); // 正規化

  // 前傾/後傾を計算 (鼻と腰の位置関係)
  const nose = landmarks[0];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const hipCenter = {
    x: (leftHip.x + rightHip.x) / 2,
    z: (leftHip.z + rightHip.z) / 2,
  };

  // Z軸の差で前傾/後傾を判定 (-1: 後傾, 0: 直立, 1: 前傾)
  const leanAngle = Math.max(-1, Math.min(1, (hipCenter.z - nose.z) * 5));

  // 姿勢の安定性（肩の水平度）
  const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
  const stability = Math.max(0, 1 - shoulderTilt * 5);

  return {
    shoulderOpenness,
    leanAngle,
    stability,
  };
}

export function extractGestureData(results: Results): GestureData | null {
  let leftHandMovement = 0;
  let rightHandMovement = 0;

  // 左手の動き
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

  // 右手の動き
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
