export const PHOTO_CONFIG = {
  CAPTURE_TIMEOUT_MS: 30000,
  MAX_PHOTOS_PER_BATCH: 50,
  THUMBNAIL_SIZE: 60,
  FULL_IMAGE_QUALITY: 0.9,
  PAGINATION_THRESHOLD: 500,
};

export const ERROR_MESSAGES = {
  CAMERA_DENIED: 'Camera permission required. Please enable in Settings.',
  CAMERA_NOT_AVAILABLE: 'Camera is not available on this device.',
  SAVE_FAILED: 'Failed to save photo. Check storage space and try again.',
  DELETE_FAILED: 'Failed to delete photo. Please try again.',
  STORAGE_ERROR: 'Storage operation failed. Please try again.',
  DATABASE_ERROR: 'Database operation failed. Please try again.',
  INVALID_DATA: 'Invalid photo data. Please try capturing again.',
  NETWORK_UNAVAILABLE: 'Offline - changes saved locally.',
};

export const FEATURE_FLAGS = {
  ENABLE_GPS_TAGGING: false,
  ENABLE_OFFLINE_SYNC: false,
  ENABLE_ANALYTICS: false,
  ENABLE_CRASH_REPORTING: false,
};

export const APP_INFO = {
  VERSION: '1.0.0',
  BUILD_NUMBER: 1,
  MIN_EXPO_SDK: 54,
};
