import * as Crypto from 'expo-crypto';
import { CapturedPhoto } from '../types/index';
import { photoService, PendingPhoto } from './PhotoService';
import { PhotoError } from '../errors/PhotoErrors';

export interface CaptureFlow {
  onCapture: (pending: PendingPhoto) => void;
  onSaveSuccess: (photo: CapturedPhoto) => void;
  onSaveError: (error: PhotoError) => void;
  onDeleteSuccess: (photoId: string) => void;
  onDeleteError: (error: PhotoError) => void;
}

export class CaptureOrchestrator {
  private static instance: CaptureOrchestrator;
  private pendingPhoto: PendingPhoto | null = null;
  private flowCallbacks: CaptureFlow | null = null;

  private constructor() {}

  public static getInstance(): CaptureOrchestrator {
    if (!CaptureOrchestrator.instance) {
      CaptureOrchestrator.instance = new CaptureOrchestrator();
    }
    return CaptureOrchestrator.instance;
  }

  setFlowCallbacks(callbacks: CaptureFlow): void {
    this.flowCallbacks = callbacks;
  }

  async handlePhotoCapture(uri: string): Promise<void> {
    const id = Crypto.randomUUID();
    const capturedAt = new Date().toISOString();

    this.pendingPhoto = { id, uri, capturedAt };

    if (this.flowCallbacks) {
      this.flowCallbacks.onCapture(this.pendingPhoto);
    }
  }

  async handlePhotoLabel(label: string): Promise<void> {
    if (!this.pendingPhoto) {
      const error = new PhotoError(
        'INVALID_STATE' as any,
        'No pending photo to label',
      );
      this.flowCallbacks?.onSaveError(error);
      return;
    }

    try {
      const savedPhoto = await photoService.savePhoto(this.pendingPhoto, label);
      this.pendingPhoto = null;
      this.flowCallbacks?.onSaveSuccess(savedPhoto);
    } catch (error) {
      this.flowCallbacks?.onSaveError(error as PhotoError);
    }
  }

  async handlePhotoDiscard(): Promise<void> {
    this.pendingPhoto = null;
  }

  async handlePhotoDelete(photoId: string): Promise<void> {
    try {
      await photoService.deletePhotoById(photoId);
      this.flowCallbacks?.onDeleteSuccess(photoId);
    } catch (error) {
      this.flowCallbacks?.onDeleteError(error as PhotoError);
    }
  }

  getPendingPhoto(): PendingPhoto | null {
    return this.pendingPhoto;
  }

  clearPendingPhoto(): void {
    this.pendingPhoto = null;
  }
}

export const captureOrchestrator = CaptureOrchestrator.getInstance();
