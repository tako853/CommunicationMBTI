import { useState, useEffect, useCallback, useRef } from 'react';
import type { ExpressionData } from '../types/analysis';
import {
  loadFaceApiModels,
  detectExpressions,
  isModelsLoaded,
} from '../services/faceApiService';

interface UseFaceAnalysisReturn {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  currentExpressions: ExpressionData | null;
  analyze: (video: HTMLVideoElement) => Promise<void>;
}

export function useFaceAnalysis(): UseFaceAnalysisReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentExpressions, setCurrentExpressions] =
    useState<ExpressionData | null>(null);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    const init = async () => {
      try {
        await loadFaceApiModels();
        setIsReady(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load face-api models'
        );
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const analyze = useCallback(async (video: HTMLVideoElement) => {
    if (!isModelsLoaded()) return;

    try {
      const expressions = await detectExpressions(video);
      setCurrentExpressions(expressions);
    } catch (err) {
      console.error('Face analysis error:', err);
    }
  }, []);

  return {
    isLoading,
    isReady,
    error,
    currentExpressions,
    analyze,
  };
}
