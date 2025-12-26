import * as faceapi from 'face-api.js';
import type { ExpressionData } from '../types/analysis';

const MODEL_URL = '/models';

let modelsLoaded = false;

export async function loadFaceApiModels(): Promise<void> {
  if (modelsLoaded) return;

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]);

  modelsLoaded = true;
}

export function isModelsLoaded(): boolean {
  return modelsLoaded;
}

export async function detectExpressions(
  video: HTMLVideoElement
): Promise<ExpressionData | null> {
  if (!modelsLoaded) return null;

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();

  if (!detection) return null;

  const expressions = detection.expressions;

  return {
    neutral: expressions.neutral,
    happy: expressions.happy,
    sad: expressions.sad,
    angry: expressions.angry,
    fearful: expressions.fearful,
    disgusted: expressions.disgusted,
    surprised: expressions.surprised,
  };
}

export function getDominantExpression(expressions: ExpressionData): string {
  const entries = Object.entries(expressions) as [string, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}
