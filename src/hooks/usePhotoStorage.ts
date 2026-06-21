import { useState, useCallback } from 'react';
import { photoService, PendingPhoto } from '../services/PhotoService';
import { CapturedPhoto } from '../types/index';
import { PhotoError } from '../errors/PhotoErrors';

export interface UsePhotoStorageReturn {
  isLoading: boolean;
  error: PhotoError | null;
  savePhoto: (pending: PendingPhoto, label: string) => Promise<CapturedPhoto | null>;
  deletePhoto: (photoId: string) => Promise<boolean>;
  clearError: () => void;
}

export function usePhotoStorage(): UsePhotoStorageReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PhotoError | null>(null);

  const savePhoto = useCallback(
    async (pending: PendingPhoto, label: string): Promise<CapturedPhoto | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const saved = await photoService.savePhoto(pending, label);
        return saved;
      } catch (err) {
        const photoError = err as PhotoError;
        setError(photoError);
        console.error('Photo save error:', photoError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const deletePhoto = useCallback(async (photoId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await photoService.deletePhotoById(photoId);
      return true;
    } catch (err) {
      const photoError = err as PhotoError;
      setError(photoError);
      console.error('Photo delete error:', photoError);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    savePhoto,
    deletePhoto,
    clearError,
  };
}
