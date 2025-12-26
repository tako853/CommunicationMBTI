import { useState, useEffect, useCallback, useRef } from 'react';
import type { Results } from '@mediapipe/holistic';
import type {
  PoseData,
  GestureData,
  HeadPoseData,
  GazeData,
  HandShapeData,
  BodyMovementData,
} from '../types/analysis';
import {
  initMediaPipe,
  setOnResultsCallback,
  processFrame,
  extractPoseData,
  extractGestureData,
  extractHeadPoseData,
  extractGazeData,
  extractHandShapeData,
  extractBodyMovementData,
} from '../services/mediaPipeService';

interface UseMediaPipeReturn {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  currentPose: PoseData | null;
  currentGesture: GestureData | null;
  currentHeadPose: HeadPoseData | null;
  currentGaze: GazeData | null;
  currentHandShape: HandShapeData | null;
  currentBodyMovement: BodyMovementData | null;
  analyze: (video: HTMLVideoElement) => Promise<void>;
}

export function useMediaPipe(): UseMediaPipeReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPose, setCurrentPose] = useState<PoseData | null>(null);
  const [currentGesture, setCurrentGesture] = useState<GestureData | null>(null);
  const [currentHeadPose, setCurrentHeadPose] = useState<HeadPoseData | null>(null);
  const [currentGaze, setCurrentGaze] = useState<GazeData | null>(null);
  const [currentHandShape, setCurrentHandShape] = useState<HandShapeData | null>(null);
  const [currentBodyMovement, setCurrentBodyMovement] = useState<BodyMovementData | null>(null);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    const init = async () => {
      try {
        await initMediaPipe();

        setOnResultsCallback((results: Results) => {
          setCurrentPose(extractPoseData(results));
          setCurrentGesture(extractGestureData(results));
          setCurrentHeadPose(extractHeadPoseData(results));
          setCurrentGaze(extractGazeData(results));
          setCurrentHandShape(extractHandShapeData(results));
          setCurrentBodyMovement(extractBodyMovementData(results));
        });

        setIsReady(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to initialize MediaPipe'
        );
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const analyze = useCallback(async (video: HTMLVideoElement) => {
    try {
      await processFrame(video);
    } catch (err) {
      console.error('MediaPipe analysis error:', err);
    }
  }, []);

  return {
    isLoading,
    isReady,
    error,
    currentPose,
    currentGesture,
    currentHeadPose,
    currentGaze,
    currentHandShape,
    currentBodyMovement,
    analyze,
  };
}
