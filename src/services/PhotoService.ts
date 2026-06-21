import { CapturedPhoto } from '../types/index';
import { deletePhoto, fetchAllPhotos, initDB, insertPhoto } from '../db/database';
import { PhotoError, PhotoSaveError, PhotoDeleteError, PhotoErrorCode } from '../errors/PhotoErrors';
import { storageService } from './StorageService';

export interface PendingPhoto {
  id: string;
  uri: string;
  capturedAt: string;
}

export class PhotoService {
  private static instance: PhotoService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): PhotoService {
    if (!PhotoService.instance) {
      PhotoService.instance = new PhotoService();
    }
    return PhotoService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    try {
      initDB();
      this.isInitialized = true;
    } catch (error) {
      throw new PhotoError(
        PhotoErrorCode.DATABASE_ERROR,
        `Failed to initialize database: ${(error as Error).message}`,
        { originalError: error },
      );
    }
  }

  async listAllPhotos(): Promise<CapturedPhoto[]> {
    try {
      return fetchAllPhotos();
    } catch (error) {
      throw new PhotoError(
        PhotoErrorCode.DATABASE_ERROR,
        `Failed to fetch photos: ${(error as Error).message}`,
        { originalError: error },
      );
    }
  }

  async savePhoto(pendingPhoto: PendingPhoto, label: string): Promise<CapturedPhoto> {
    if (!label.trim()) {
      throw new PhotoError(
        PhotoErrorCode.INVALID_PHOTO_DATA,
        'Photo label cannot be empty',
      );
    }

    try {
      const permanentPath = await storageService.copyPhotoToDevice(
        pendingPhoto.uri,
        pendingPhoto.id,
      );

      const photo: CapturedPhoto = {
        id: pendingPhoto.id,
        localPath: permanentPath,
        capturedAt: pendingPhoto.capturedAt,
        label: label.trim(),
      };

      insertPhoto(photo);
      return photo;
    } catch (error) {
      if (error instanceof PhotoError) {
        throw error;
      }
      throw new PhotoSaveError(
        `Failed to save photo: ${(error as Error).message}`,
        { pendingPhoto, label, originalError: error },
      );
    }
  }

  async deletePhotoById(photoId: string): Promise<void> {
    try {
      const allPhotos = await this.listAllPhotos();
      const photoToDelete = allPhotos.find(p => p.id === photoId);

      if (!photoToDelete) {
        throw new PhotoDeleteError(`Photo with id ${photoId} not found`);
      }

      deletePhoto(photoId);
      await storageService.deletePhotoFile(photoToDelete.localPath);
    } catch (error) {
      if (error instanceof PhotoError) {
        throw error;
      }
      throw new PhotoDeleteError(
        `Failed to delete photo: ${(error as Error).message}`,
        { photoId, originalError: error },
      );
    }
  }

  validatePendingPhoto(photo: PendingPhoto): boolean {
    return !!(photo.id && photo.uri && photo.capturedAt);
  }
}

export const photoService = PhotoService.getInstance();
