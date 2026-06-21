import * as FileSystem from 'expo-file-system/legacy';
import { StorageError, PhotoErrorCode } from '../errors/PhotoErrors';

export interface StorageResult {
  success: boolean;
  path?: string;
  error?: StorageError;
}

export class StorageService {
  private static instance: StorageService;
  private photosDirectory: string | null = null;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async getPhotosDirectory(): Promise<string> {
    if (this.photosDirectory) {
      return this.photosDirectory;
    }

    if (!FileSystem.documentDirectory) {
      throw new StorageError(
        PhotoErrorCode.DIRECTORY_CREATION_FAILED,
        'Document directory not available',
      );
    }

    const photosDir = `${FileSystem.documentDirectory}photos/`;
    await this.ensureDirectoryExists(photosDir);
    this.photosDirectory = photosDir;
    return photosDir;
  }

  private async ensureDirectoryExists(directory: string): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }
    } catch (error) {
      throw new StorageError(
        PhotoErrorCode.DIRECTORY_CREATION_FAILED,
        `Failed to create directory: ${(error as Error).message}`,
        { directory, originalError: error },
      );
    }
  }

  async copyPhotoToDevice(tempUri: string, photoId: string): Promise<string> {
    try {
      const photosDir = await this.getPhotosDirectory();
      const permanentPath = `${photosDir}${photoId}.jpg`;

      await FileSystem.copyAsync({
        from: tempUri,
        to: permanentPath,
      });

      return permanentPath;
    } catch (error) {
      throw new StorageError(
        PhotoErrorCode.STORAGE_COPY_FAILED,
        `Failed to copy photo: ${(error as Error).message}`,
        { photoId, tempUri, originalError: error },
      );
    }
  }

  async deletePhotoFile(filePath: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    } catch (error) {
      throw new StorageError(
        PhotoErrorCode.STORAGE_DELETE_FAILED,
        `Failed to delete photo file: ${(error as Error).message}`,
        { filePath, originalError: error },
      );
    }
  }

  async getPhotoFileInfo(filePath: string): Promise<FileSystem.FileInfo | null> {
    try {
      const info = await FileSystem.getInfoAsync(filePath);
      return info.exists ? info : null;
    } catch (error) {
      console.warn(`Failed to get file info: ${(error as Error).message}`);
      return null;
    }
  }

  resetCachedDirectory(): void {
    this.photosDirectory = null;
  }
}

export const storageService = StorageService.getInstance();
