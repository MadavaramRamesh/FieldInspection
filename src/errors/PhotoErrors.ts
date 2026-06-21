export enum PhotoErrorCode {
  CAMERA_PERMISSION_DENIED = 'CAMERA_PERMISSION_DENIED',
  CAMERA_NOT_AVAILABLE = 'CAMERA_NOT_AVAILABLE',
  PHOTO_CAPTURE_FAILED = 'PHOTO_CAPTURE_FAILED',
  PHOTO_SAVE_FAILED = 'PHOTO_SAVE_FAILED',
  PHOTO_DELETE_FAILED = 'PHOTO_DELETE_FAILED',
  STORAGE_COPY_FAILED = 'STORAGE_COPY_FAILED',
  STORAGE_DELETE_FAILED = 'STORAGE_DELETE_FAILED',
  DIRECTORY_CREATION_FAILED = 'DIRECTORY_CREATION_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INVALID_PHOTO_DATA = 'INVALID_PHOTO_DATA',
}

export class PhotoError extends Error {
  constructor(
    public code: PhotoErrorCode,
    message: string,
    public context?: Record<string, any>,
  ) {
    super(message)
    this.name = 'PhotoError'
  }

  public getUserMessage(): string {
    const messages: Record<PhotoErrorCode, string> = {
      [PhotoErrorCode.CAMERA_PERMISSION_DENIED]:
        'Camera permission required. Please enable in Settings.',
      [PhotoErrorCode.CAMERA_NOT_AVAILABLE]:
        'Camera is not available on this device.',
      [PhotoErrorCode.PHOTO_CAPTURE_FAILED]:
        'Failed to capture photo. Please try again.',
      [PhotoErrorCode.PHOTO_SAVE_FAILED]:
        'Failed to save photo. Please check storage space and try again.',
      [PhotoErrorCode.PHOTO_DELETE_FAILED]:
        'Failed to delete photo. Please try again.',
      [PhotoErrorCode.STORAGE_COPY_FAILED]:
        'Failed to copy photo to storage. Please try again.',
      [PhotoErrorCode.STORAGE_DELETE_FAILED]:
        'Failed to delete photo file. Please try again.',
      [PhotoErrorCode.DIRECTORY_CREATION_FAILED]:
        'Failed to create storage directory. Please check permissions.',
      [PhotoErrorCode.DATABASE_ERROR]:
        'Database operation failed. Please try again.',
      [PhotoErrorCode.INVALID_PHOTO_DATA]:
        'Invalid photo data. Please try capturing again.',
    }
    return messages[this.code] || 'An unexpected error occurred.'
  }
}

export class CameraPermissionError extends PhotoError {
  constructor(message: string) {
    super(PhotoErrorCode.CAMERA_PERMISSION_DENIED, message)
    this.name = 'CameraPermissionError'
  }
}

export class PhotoSaveError extends PhotoError {
  constructor(message: string, context?: Record<string, any>) {
    super(PhotoErrorCode.PHOTO_SAVE_FAILED, message, context)
    this.name = 'PhotoSaveError'
  }
}

export class PhotoDeleteError extends PhotoError {
  constructor(message: string, context?: Record<string, any>) {
    super(PhotoErrorCode.PHOTO_DELETE_FAILED, message, context)
    this.name = 'PhotoDeleteError'
  }
}

export class StorageError extends PhotoError {
  constructor(code: PhotoErrorCode, message: string, context?: Record<string, any>) {
    super(code, message, context)
    this.name = 'StorageError'
  }
}
