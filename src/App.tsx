import { useState, useCallback, useRef } from 'react';
import { WebcamCapture } from './components/WebcamCapture';
import { ScoreDisplay } from './components/ScoreDisplay';
import { useFaceAnalysis } from './hooks/useFaceAnalysis';
import { useMediaPipe } from './hooks/useMediaPipe';
import { calculateAllScores, generateSummary } from './services/scoreEngine';
import { exportSessionData, generateSessionId } from './utils/dataExport';
import type { TimelineEntry, SessionData, CommunicationScores } from './types/analysis';
import './App.css';

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scores, setScores] = useState<CommunicationScores>({
    expressiveness: 0,
    gestureActivity: 0,
    posturalOpenness: 0,
  });

  const timelineRef = useRef<TimelineEntry[]>([]);
  const sessionIdRef = useRef<string>('');
  const startTimeRef = useRef<string>('');

  const faceAnalysis = useFaceAnalysis();
  const mediaPipe = useMediaPipe();

  const isLoading = faceAnalysis.isLoading || mediaPipe.isLoading;
  const isReady = faceAnalysis.isReady && mediaPipe.isReady;
  const error = faceAnalysis.error || mediaPipe.error;

  const handleFrame = useCallback(
    async (video: HTMLVideoElement) => {
      await Promise.all([
        faceAnalysis.analyze(video),
        mediaPipe.analyze(video),
      ]);

      const entry: TimelineEntry = {
        timestamp: Date.now(),
        expressions: faceAnalysis.currentExpressions,
        pose: mediaPipe.currentPose,
        gesture: mediaPipe.currentGesture,
        headPose: mediaPipe.currentHeadPose,
        gaze: mediaPipe.currentGaze,
        handShape: mediaPipe.currentHandShape,
        bodyMovement: mediaPipe.currentBodyMovement,
      };

      timelineRef.current.push(entry);

      // リアルタイムスコア更新（最新30エントリで計算）
      const recentEntries = timelineRef.current.slice(-30);
      const newScores = calculateAllScores(recentEntries);
      setScores(newScores);
    },
    [faceAnalysis, mediaPipe]
  );

  const handleStart = () => {
    sessionIdRef.current = generateSessionId();
    startTimeRef.current = new Date().toISOString();
    timelineRef.current = [];
    setIsAnalyzing(true);
  };

  const handleStop = () => {
    setIsAnalyzing(false);
  };

  const handleExport = () => {
    const endTime = new Date().toISOString();
    const startTime = new Date(startTimeRef.current);
    const duration = (Date.now() - startTime.getTime()) / 1000;

    const sessionData: SessionData = {
      sessionId: sessionIdRef.current,
      startTime: startTimeRef.current,
      endTime,
      duration,
      timeline: timelineRef.current,
      scores: calculateAllScores(timelineRef.current),
      summary: generateSummary(timelineRef.current),
    };

    exportSessionData(sessionData);
  };

  return (
    <div className="app">
      <h1>Communication Style Analyzer</h1>

      {isLoading && (
        <div className="loading">
          モデルを読み込み中...
        </div>
      )}

      {error && (
        <div className="error">
          エラー: {error}
        </div>
      )}

      {isReady && (
        <>
          <div className="main-content">
            <div className="video-section">
              <WebcamCapture
                onFrame={handleFrame}
                isAnalyzing={isAnalyzing}
              />

              <div className="controls">
                {!isAnalyzing ? (
                  <button onClick={handleStart} className="btn-primary">
                    分析開始
                  </button>
                ) : (
                  <button onClick={handleStop} className="btn-secondary">
                    分析停止
                  </button>
                )}

                {timelineRef.current.length > 0 && (
                  <button onClick={handleExport} className="btn-export">
                    JSONエクスポート
                  </button>
                )}
              </div>
            </div>

            <div className="score-section">
              <ScoreDisplay
                scores={scores}
                currentExpressions={faceAnalysis.currentExpressions}
                currentPose={mediaPipe.currentPose}
                currentGesture={mediaPipe.currentGesture}
                currentHeadPose={mediaPipe.currentHeadPose}
                currentGaze={mediaPipe.currentGaze}
                currentHandShape={mediaPipe.currentHandShape}
                currentBodyMovement={mediaPipe.currentBodyMovement}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
