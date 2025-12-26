import { useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

interface WebcamCaptureProps {
  onFrame: (video: HTMLVideoElement) => void;
  isAnalyzing: boolean;
  frameRate?: number;
}

export function WebcamCapture({
  onFrame,
  isAnalyzing,
  frameRate = 10,
}: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const intervalRef = useRef<number | null>(null);

  const captureFrame = useCallback(() => {
    if (webcamRef.current?.video) {
      const video = webcamRef.current.video;
      if (video.readyState === 4) {
        onFrame(video);
      }
    }
  }, [onFrame]);

  useEffect(() => {
    if (isAnalyzing) {
      intervalRef.current = window.setInterval(
        captureFrame,
        1000 / frameRate
      );
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAnalyzing, captureFrame, frameRate]);

  return (
    <div className="webcam-container">
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored={true}
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: 'user',
        }}
        style={{
          width: '100%',
          maxWidth: '640px',
          borderRadius: '8px',
        }}
      />
    </div>
  );
}
