# Field Inspection

A photo capture app for field inspections. Quickly photograph assets, apply labels, and maintain a persistent local gallery.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npx expo start

# Scan QR code with Expo Go (iOS/Android)
```

## Tech Stack

- **Framework:** Expo 54 (React Native 0.81.5)
- **Database:** SQLite (expo-sqlite 16.0.10)
- **File System:** Expo FileSystem (legacy API)
- **Camera:** expo-camera 17.0.10
- **Cryptography:** expo-crypto 15.0.9 (UUID generation)

## Architecture Decisions

### SQLite Over AsyncStorage

Photos are persisted in SQLite instead of AsyncStorage because:

- **Structured queries:** SQLite supports `ORDER BY capturedAt DESC` to maintain chronological order without client-side sorting
- **DELETE efficiency:** `DELETE FROM photos WHERE id = ?` is atomic and doesn't require read-modify-write cycles
- **Scalability:** SQLite handles hundreds of photos efficiently; AsyncStorage is string-only and requires full deserialization on every modification
- **Integrity:** Schema validation and type safety at the database layer

### Immediate Timestamp Capture

`capturedAt` is set immediately after `takePictureAsync()` resolves, not when the photo is labeled or saved. This ensures:

- **Accuracy:** Timestamp reflects the actual capture moment, not the label entry time (which could be minutes later)
- **Audit trail:** Photos are timestamped by physical capture order, not user actions
- **Consistency:** All timestamps are ISO 8601 format from `Date.toISOString()`

### Permanent Photo Storage

Photos are copied from the camera temporary cache to `FileSystem.documentDirectory + 'photos/'` before database insertion. This ensures:

- **Data persistence:** Photos survive app uninstalls (documents directory is exempt from automatic cleanup)
- **URI stability:** Permanent file paths don't change between app sessions
- **Cleanup:** Deleting a photo removes both the database record and the file atomically

## App Flow

1. **Initialization:** On mount, `initDB()` creates the photos table, then `fetchAllPhotos()` restores persisted photos to app state
2. **Capture:** Camera shutter → generate UUID → timestamp immediately → open label modal with live preview
3. **Label:** User enters label → save copies file to permanent directory → `insertPhoto()` into SQLite → prepend to gallery
4. **Discard:** Modal close without label → clears pending capture (no side effects)
5. **Delete:** User taps delete → `deletePhoto()` from DB first → `FileSystem.deleteAsync()` removes file → state updated

## File Structure

```
src/
  types/
    index.ts              # CapturedPhoto interface
  utils/
    formatDate.ts         # DD/MM/YYYY HH:mm formatter
  db/
    database.ts           # SQLite initialization and CRUD
  components/
    CameraView.tsx        # Live preview + capture button
    LabelModal.tsx        # Label entry with thumbnail
    PhotoListItem.tsx     # Single photo row with delete button
    PhotoList.tsx         # FlatList of all photos
App.tsx                   # Main screen, state management, FileSystem ops
```

## Future Enhancements

- **GPS tagging:** Capture location at photo time using expo-location
- **Offline sync:** Queue photos for upload when device reconnects; local-first persistence
- **Inspection sessions:** Group photos by date/location/inspector into sessions for batch operations
- **Swipe to delete:** Gesture-based delete instead of tap for faster workflows
- **Photo metadata:** EXIF preservation, image compression, thumbnailing
- **Export:** CSV/PDF reports from captured photos with GPS, timestamp, labels

## Database Schema

```sql
CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  localPath TEXT,
  capturedAt TEXT,
  label TEXT
);
```

- **id:** UUID (v4) generated at capture time
- **localPath:** Absolute file:// URI on device filesystem
- **capturedAt:** ISO 8601 timestamp from `Date.toISOString()`
- **label:** User-entered text (required, trimmed)

## Testing Locally

1. Open the app in Expo Go
2. Tap "Capture Photo" → permit camera access
3. Take a photo → modal appears with preview
4. Enter label (e.g., "Front damage") → tap Save
5. Photo appears in list with timestamp
6. Tap trash icon → photo deletes from DB and disk
7. Close and reopen app → photos persist

