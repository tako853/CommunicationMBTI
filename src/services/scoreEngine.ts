import type {
  TimelineEntry,
  CommunicationScores,
  SessionSummary,
} from '../types/analysis';
import { getDominantExpression } from './faceApiService';

// 表現力スコアを計算
export function calculateExpressiveness(
  timeline: TimelineEntry[]
): number {
  const expressionEntries = timeline.filter((e) => e.expressions !== null);
  if (expressionEntries.length === 0) return 0;

  let totalVariation = 0;
  let emotionDiversity = new Set<string>();

  for (let i = 1; i < expressionEntries.length; i++) {
    const prev = expressionEntries[i - 1].expressions!;
    const curr = expressionEntries[i].expressions!;

    // 表情変化量を計算
    const variation =
      Math.abs(curr.happy - prev.happy) +
      Math.abs(curr.sad - prev.sad) +
      Math.abs(curr.angry - prev.angry) +
      Math.abs(curr.surprised - prev.surprised);

    totalVariation += variation;

    // 支配的な感情を記録
    const dominant = getDominantExpression(curr);
    if (dominant !== 'neutral') {
      emotionDiversity.add(dominant);
    }
  }

  const avgVariation = totalVariation / expressionEntries.length;
  const diversityBonus = emotionDiversity.size * 10;

  return Math.min(100, avgVariation * 200 + diversityBonus);
}

// ジェスチャー活性度スコアを計算
export function calculateGestureActivity(
  timeline: TimelineEntry[]
): number {
  const gestureEntries = timeline.filter((e) => e.gesture !== null);
  if (gestureEntries.length === 0) return 0;

  const avgFrequency =
    gestureEntries.reduce((sum, e) => sum + e.gesture!.gestureFrequency, 0) /
    gestureEntries.length;

  return Math.min(100, avgFrequency * 100);
}

// 姿勢開放性スコアを計算
export function calculatePosturalOpenness(
  timeline: TimelineEntry[]
): number {
  const poseEntries = timeline.filter((e) => e.pose !== null);
  if (poseEntries.length === 0) return 0;

  const avgOpenness =
    poseEntries.reduce((sum, e) => sum + e.pose!.shoulderOpenness, 0) /
    poseEntries.length;

  const avgStability =
    poseEntries.reduce((sum, e) => sum + e.pose!.stability, 0) /
    poseEntries.length;

  // 前傾姿勢はポジティブに評価
  const avgLean =
    poseEntries.reduce((sum, e) => sum + e.pose!.leanAngle, 0) /
    poseEntries.length;
  const leanBonus = avgLean > 0 ? avgLean * 20 : 0;

  return Math.min(100, avgOpenness * 50 + avgStability * 30 + leanBonus);
}

// 全スコアを計算
export function calculateAllScores(
  timeline: TimelineEntry[]
): CommunicationScores {
  return {
    expressiveness: Math.round(calculateExpressiveness(timeline)),
    gestureActivity: Math.round(calculateGestureActivity(timeline)),
    posturalOpenness: Math.round(calculatePosturalOpenness(timeline)),
  };
}

// セッションサマリーを生成
export function generateSummary(
  timeline: TimelineEntry[]
): SessionSummary {
  const expressionEntries = timeline.filter((e) => e.expressions !== null);

  // 感情分布を計算
  const emotionCounts: Record<string, number> = {
    neutral: 0,
    happy: 0,
    sad: 0,
    angry: 0,
    fearful: 0,
    disgusted: 0,
    surprised: 0,
  };

  for (const entry of expressionEntries) {
    const dominant = getDominantExpression(entry.expressions!);
    emotionCounts[dominant]++;
  }

  const total = expressionEntries.length || 1;
  const emotionDistribution: Record<string, number> = {};
  for (const [emotion, count] of Object.entries(emotionCounts)) {
    emotionDistribution[emotion] = Math.round((count / total) * 100);
  }

  // 支配的な感情を特定
  const dominantEmotion = Object.entries(emotionCounts).sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  // 平均ジェスチャー頻度
  const gestureEntries = timeline.filter((e) => e.gesture !== null);
  const averageGestureFrequency =
    gestureEntries.length > 0
      ? gestureEntries.reduce((sum, e) => sum + e.gesture!.gestureFrequency, 0) /
        gestureEntries.length
      : 0;

  // 姿勢安定性
  const poseEntries = timeline.filter((e) => e.pose !== null);
  const postureStability =
    poseEntries.length > 0
      ? poseEntries.reduce((sum, e) => sum + e.pose!.stability, 0) /
        poseEntries.length
      : 0;

  return {
    dominantEmotion,
    emotionDistribution,
    averageGestureFrequency,
    postureStability,
  };
}
