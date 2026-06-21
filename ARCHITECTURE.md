# Field Inspection App - Architecture Documentation

## System Overview

This is an offline-first mobile application for capturing, labeling, and managing field inspection photos. The system prioritizes data integrity, audit compliance, and team scalability.

### Core Principle
**Photos are timestamped at capture moment.** This timestamp is the authoritative record of when evidence was collected and cannot be changed.

---

## Architecture Layers

### Layer 1: UI Components (Presentational)
**Files:** `src/components/`
- `CameraView.tsx` - Camera preview + capture button
- `LabelModal.tsx` - Photo label input
- `PhotoList.tsx` - Scrollable photo gallery
- `PhotoListItem.tsx` - Individual photo row

**Responsibility:** Render UI only. No business logic.

### Layer 2: Custom Hooks (Business Logic & State)
**Files:** `src/hooks/`
- `usePhotoCapture` - Capture flow management
- `usePhotoStorage` - Save/delete operations with error handling
- `usePhotoList` - Photo list state and initialization
- `usePhotoModal` - Modal visibility state

**Responsibility:** Extract reusable logic from components. Handle state transitions, error management.

### Layer 3: Services (Business Rules)
**Files:** `src/services/`
- `PhotoService` - CRUD operations, validation, business rules
- `StorageService` - FileSystem abstraction, photo file management
- `CaptureOrchestrator` - Coordinates capture → label → save flow

**Responsibility:** Encapsulate business logic. Single source of truth for operations.

### Layer 4: Data Access
**Files:** `src/db/`
- `database.ts` - SQLite initialization and queries

**Responsibility:** Low-level database operations.

### Layer 5: Error Handling
**Files:** `src/errors/`
- `PhotoErrors.ts` - Error types, user messages, error codes

**Responsibility:** Structured error handling. User-friendly messages.

---

## Data Flow

### Capture Flow
```
CameraView.takePictureAsync()
    ↓
[IMMEDIATE] capturedAt = new Date().toISOString()
    ↓
handlePhotoCaptured(id, uri, capturedAt)
    ↓
usePhotoCapture hook stores PendingPhoto
    ↓
LabelModal opens
    ↓
User enters label → handleSaveLabel(label)
    ↓
usePhotoStorage.savePhoto(pending, label)
    ↓
PhotoService.savePhoto()
    ↓
StorageService.copyPhotoToDevice() [FileSystem]
    ↓
insertPhoto() [SQLite]
    ↓
App.addPhoto() [UI state]
    ↓
Photo appears in list
```

### Delete Flow
```
PhotoList: User taps delete → handleDeletePhoto(id)
    ↓
usePhotoStorage.deletePhoto(id)
    ↓
PhotoService.deletePhotoById(id)
    ↓
deletePhoto(id) [SQLite] ← First
    ↓
storageService.deletePhotoFile(path) [FileSystem]
    ↓
removePhoto(id) [UI state]
    ↓
Photo removed from list
```

---

## Component Responsibilities

### App.tsx (Main Container)
- Orchestrates all hooks
- Handles navigation between states
- Connects UI to business logic
- Manages side effects (modal visibility, error alerts)

**Lines:** ~80 (clean, readable, focused)

### CameraView (Presentational)
- Renders camera preview
- Handles camera permission request
- Calls onPhotoCaptured callback
- No state management

### LabelModal (Presentational)
- Text input for label
- Save/Discard buttons
- Disabled state when label empty
- No business logic

### PhotoList (Presentational)
- FlatList with photo items
- Empty state message
- Handles delete callback
- No data manipulation

---

## Error Handling Strategy

### Error Types
```typescript
PhotoErrorCode (enum)
├─ CAMERA_PERMISSION_DENIED
├─ PHOTO_CAPTURE_FAILED
├─ PHOTO_SAVE_FAILED
├─ PHOTO_DELETE_FAILED
├─ STORAGE_COPY_FAILED
├─ STORAGE_DELETE_FAILED
├─ DIRECTORY_CREATION_FAILED
├─ DATABASE_ERROR
└─ INVALID_PHOTO_DATA
```

### Error Propagation
1. **Service Layer** throws specific PhotoError
2. **Hook** catches error, sets error state
3. **App.tsx** displays user-friendly message via `error.getUserMessage()`
4. **Console** logs for debugging

### Error Messages
- Technical: Logged to console for debugging
- User-facing: Simple, actionable messages in Alert

---

## State Management

### Global State Patterns
```typescript
// usePhotoList - Photo gallery state
const { photos, addPhoto, removePhoto } = usePhotoList()

// usePhotoCapture - Pending capture state
const { pendingCapture, handlePhotoCaptured } = usePhotoCapture()

// usePhotoStorage - Save/delete operations
const { savePhoto, deletePhoto, error } = usePhotoStorage()

// usePhotoModal - Modal visibility
const { modalVisible, openModal, closeModal } = usePhotoModal()
```

### Why This Pattern?
- ✅ Hooks are reusable across screens
- ✅ Easy to test (mock hooks in tests)
- ✅ Scales to larger apps (migrate to Context/Redux later)
- ✅ Clear separation of concerns

---

## Database Schema

```sql
CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  localPath TEXT NOT NULL,
  capturedAt TEXT NOT NULL,
  label TEXT NOT NULL
);
```

### Indexes (Future)
```sql
CREATE INDEX idx_photos_capturedAt ON photos(capturedAt DESC);
```

### Why SQLite Over AsyncStorage?
1. **Structured Queries** - ORDER BY, WHERE, GROUP BY
2. **Atomic Operations** - DELETE WHERE id = ? is atomic
3. **Scale** - Efficient for 10K+ photos
4. **No Read-Modify-Write** - AsyncStorage requires full deserialization

---

## File System Organization

```
FileSystem.documentDirectory/
├─ photos/
│  ├─ <uuid-1>.jpg
│  ├─ <uuid-2>.jpg
│  └─ <uuid-3>.jpg
```

### Why Separate Photos?
- ✅ Large files not in database
- ✅ Easy to backup/restore
- ✅ Team can access via FileSystem API later
- ✅ Reduced DB size

---

## Scalability Considerations

### Current Performance
- **Handles:** 100-500 photos efficiently
- **FlatList:** Virtualized (only visible items rendered)
- **Images:** Small thumbnails (60x60)
- **DB:** Single table, no complex joins

### Scaling to 5K+ Photos
1. Add `LIMIT OFFSET` pagination to `fetchAllPhotos()`
2. Load photos in batches
3. Add database index on `capturedAt DESC`
4. Implement photo filtering/search

### Scaling to 50K+ Photos
1. Consider cloud sync for backup
2. Archive old photos to server
3. Implement lazy-load thumbnails
4. Add analytics/monitoring

---

## Testing Structure

### Test Organization
```
__tests__/
├─ services/
│  ├─ PhotoService.test.ts
│  └─ StorageService.test.ts
├─ hooks/
│  ├─ usePhotoCapture.test.ts
│  └─ usePhotoStorage.test.ts
└─ utils/
   └─ formatDate.test.ts
```

### Testable Design
- ✅ Services have no UI dependencies
- ✅ Hooks return state + callbacks
- ✅ Error types are serializable
- ✅ PhotoService.savePhoto() is pure (no side effects beyond DB)

### What NOT to Test
- React Native UI components (use Detox/Appium instead)
- Database queries (test database layer separately)
- FileSystem (use mocks)

---

## Performance Monitoring Points

Team should add monitoring at these locations:

```typescript
// Photo capture time
const capturedAt = new Date().toISOString() // ← mark start
await photoService.savePhoto(...) // ← mark end, measure duration

// Save success rate
const success = await savePhoto(...)
// Log: metric('photo_save_success', success)

// Delete operations
await photoService.deletePhotoById(id)
// Log: event('photo_deleted', { photoId: id })

// App startup time
usePhotoList() // ← measure time to load photos
// Log: metric('app_startup_time', duration)
```

---

## Future Architecture Changes

### Phase 2: GPS Tagging
- Add `GPSService` to capture coordinates
- Extend `CapturedPhoto` interface with `latitude, longitude`
- Add `expo-location` permission handling

### Phase 3: Offline Sync
- Add `SyncService` to queue uploads
- Add `SyncOrchestrator` to coordinate push/pull
- Consider: Redux for complex sync state

### Phase 4: Multi-Inspection Workflows
- Add `InspectionService` for grouping photos
- Consider: Context API for inspection session state
- Add filters/search by inspection

---

## Development Guidelines

### Adding a New Feature

**Example: Add date filtering to photo list**

1. **Extend Service Layer**
   ```typescript
   // src/services/PhotoService.ts
   async getPhotosByDate(startDate, endDate): Promise<CapturedPhoto[]>
   ```

2. **Add Hook** (optional, if reusable)
   ```typescript
   // src/hooks/usePhotoFilter.ts
   export function usePhotoFilter() {
     const filterByDate = (photos, startDate, endDate) => {...}
     return { filterByDate }
   }
   ```

3. **Update Component**
   ```typescript
   // In App.tsx
   const filtered = usePhotoFilter().filterByDate(...)
   <PhotoList photos={filtered} />
   ```

4. **No business logic in components** ✓

### Code Review Checklist
- [ ] No business logic in components?
- [ ] Errors typed and handled?
- [ ] Service layer documented?
- [ ] TypeScript types complete?
- [ ] Hooks reusable/testable?
- [ ] Functions < 50 lines?

---

## Known Limitations & Trade-offs

| Decision | Benefit | Trade-off |
|----------|---------|-----------|
| **Immediate capturedAt** | Audit-grade accuracy | Can't correct timestamp |
| **Service Layer** | Testable, scalable | More files to navigate |
| **Custom Hooks** | Reusable logic | Harder to debug than classes |
| **FileSystem + DB** | Robust storage | 2-phase delete (slightly complex) |
| **SQLite** | Scales to 10K+ | Small learning curve vs AsyncStorage |

---

## Contact & Questions

For architecture questions, refer to ADRs in `docs/adr/` or TEAM_STANDARDS.md.
