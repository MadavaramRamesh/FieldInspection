import { useState, useCallback } from 'react';
import { captureOrchestrator } from '../services/CaptureOrchestrator';
import { PendingPhoto } from '../services/PhotoService';
import { PhotoError } from '../errors/PhotoErrors';

export interface UsePhotoCaptureReturn {
  pendingCapture: PendingPhoto | null;
  handlePhotoCaptured: (id: string, uri: string, capturedAt: string) => void;
  isCapturing: boolean;
  clearPendingCapture: () => void;
}

export function usePhotoCapture(): UsePhotoCaptureReturn {
  const [pendingCapture, setPendingCapture] = useState<PendingPhoto | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handlePhotoCaptured = useCallback((id: string, uri: string, capturedAt: string) => {
    setIsCapturing(true);
    try {
      const pending: PendingPhoto = { id, uri, capturedAt };
      setPendingCapture(pending);
      captureOrchestrator.handlePhotoCapture(uri, capturedAt, id);
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const clearPendingCapture = useCallback(() => {
    setPendingCapture(null);
    captureOrchestrator.clearPendingPhoto();
  }, []);

  return {
    pendingCapture,
    handlePhotoCaptured,
    isCapturing,
    clearPendingCapture,
  };
}
