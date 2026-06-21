import { useState, useEffect } from 'react';
import { CapturedPhoto } from '../types/index';
import { photoService } from '../services/PhotoService';
import { PhotoError } from '../errors/PhotoErrors';

export interface UsePhotoListReturn {
  photos: CapturedPhoto[];
  isLoading: boolean;
  error: PhotoError | null;
  addPhoto: (photo: CapturedPhoto) => void;
  removePhoto: (photoId: string) => void;
  refreshPhotos: () => Promise<void>;
}

export function usePhotoList(): UsePhotoListReturn {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PhotoError | null>(null);

  useEffect(() => {
    const initializePhotos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await photoService.initialize();
        const persisted = await photoService.listAllPhotos();
        setPhotos(persisted);
      } catch (err) {
        const photoError = err as PhotoError;
        setError(photoError);
        console.error('Photo list initialization error:', photoError);
      } finally {
        setIsLoading(false);
      }
    };

    initializePhotos();
  }, []);

  const addPhoto = (photo: CapturedPhoto) => {
    setPhotos(prevPhotos => [photo, ...prevPhotos]);
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));
  };

  const refreshPhotos = async () => {
    setIsLoading(true);
    try {
      const persisted = await photoService.listAllPhotos();
      setPhotos(persisted);
    } catch (err) {
      const photoError = err as PhotoError;
      setError(photoError);
      console.error('Photo refresh error:', photoError);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    photos,
    isLoading,
    error,
    addPhoto,
    removePhoto,
    refreshPhotos,
  };
}
