# Team Coding Standards - Field Inspection App

This document defines how the team writes code for this project. It ensures consistency, maintainability, and scales across the team.

---

## 1. Folder Structure

```
src/
├── types/              # Data contracts (interfaces only)
│   └── index.ts
├── errors/             # Error classes and types
│   └── PhotoErrors.ts
├── services/           # Business logic (CRUD, operations)
│   ├── PhotoService.ts
│   ├── StorageService.ts
│   └── CaptureOrchestrator.ts
├── hooks/              # Reusable state logic
│   ├── usePhotoCapture.ts
│   ├── usePhotoStorage.ts
│   ├── usePhotoList.ts
│   └── usePhotoModal.ts
├── components/         # UI only (no business logic)
│   ├── CameraView.tsx
│   ├── LabelModal.tsx
│   ├── PhotoList.tsx
│   └── PhotoListItem.tsx
├── db/                 # Database access layer
│   └── database.ts
├── utils/              # Pure functions
│   └── formatDate.ts
└── constants/          # App-wide constants
    └── config.ts

docs/
├── ARCHITECTURE.md     # System design
├── TEAM_STANDARDS.md   # This file
└── adr/                # Architecture Decision Records

__tests__/              # Test files (mirror src/)
├── services/
├── hooks/
└── utils/

App.tsx                 # Root component
README.md               # User-facing documentation
ARCHITECTURE.md         # Architecture overview
```

---

## 2. Code Organization Rules

### Rule 1: No Business Logic in Components
```typescript
// ❌ BAD: Business logic in component
function PhotoScreen() {
  const handleSave = async (label) => {
    const photosDir = FileSystem.documentDirectory + 'photos/'
    await FileSystem.makeDirectoryAsync(photosDir)
    const permanentPath = photosDir + id + '.jpg'
    await FileSystem.copyAsync({ from: tempUri, to: permanentPath })
    insertPhoto({ ...photo, localPath: permanentPath })
  }
  return <Button onPress={handleSave} />
}

// ✅ GOOD: Component calls hook, hook calls service
function PhotoScreen() {
  const { savePhoto } = usePhotoStorage()
  const handleSave = (label) => savePhoto(pending, label)
  return <Button onPress={handleSave} />
}
```

### Rule 2: No Direct FileSystem/Database Calls Outside Services
```typescript
// ❌ BAD: Hook doing FileSystem work
export function usePhotoSave() {
  const save = async (photo) => {
    await FileSystem.copyAsync(...)  // ← Should be in service
    insertPhoto(photo)               // ← Should be in service
  }
}

// ✅ GOOD: Hook calls service
export function usePhotoSave() {
  const save = (photo) => photoService.savePhoto(photo)
}
```

### Rule 3: All Async Operations Return Consistent Shapes
```typescript
// ✅ GOOD: Consistent error/success pattern
async function operation(): Promise<Result | null> {
  try {
    return await photoService.savePhoto(...)
  } catch (error) {
    setError(error as PhotoError)
    return null
  }
}

// Use like:
const result = await savePhoto(...)
if (result) {
  // Success
} else {
  // Error already set in state
}
```

### Rule 4: Components Have Maximum 100 Lines
If a component exceeds 100 lines:
1. Extract hooks
2. Split into smaller components
3. Move logic to services

### Rule 5: Hooks Have Maximum 50 Lines
If a hook exceeds 50 lines:
1. Extract business logic to services
2. Break into smaller hooks

---

## 3. Naming Conventions

### Services
```typescript
// Pattern: [Domain]Service
export class PhotoService { ... }
export class StorageService { ... }
export class SyncService { ... }  // Future

// Singleton instance
export const photoService = PhotoService.getInstance()
```

### Hooks
```typescript
// Pattern: use[Feature]
export function usePhotoCapture() { ... }
export function usePhotoList() { ... }
export function usePhotoStorage() { ... }

// Return interface pattern: Use[Feature]Return
export interface UsePhotoCaptureReturn {
  pendingCapture: PendingPhoto | null
  handlePhotoCaptured: (id, uri, capturedAt) => void
}
```

### Components
```typescript
// Pattern: PascalCase, descriptive
export function CameraView({ onPhotoCaptured }) { ... }
export function LabelModal({ visible, onSave, onDiscard }) { ... }
export function PhotoListItem({ photo, onDelete }) { ... }

// Props interface pattern: [Component]Props
interface CameraViewProps {
  onPhotoCaptured: (id: string, uri: string, capturedAt: string) => void
}
```

### Variables & Functions
```typescript
// Booleans: is/has/can/should prefix
const isLoading = true
const hasError = false
const canDelete = !isLoading
const shouldRetry = true

// Arrays: plural
const photos: CapturedPhoto[] = []
const errors: PhotoError[] = []

// Callbacks: handle[Action] pattern
const handlePhotoCaptured = (photo) => { ... }
const handleSaveLabel = (label) => { ... }
const handleDeletePhoto = (id) => { ... }

// Async functions: use async keyword
async function capturePhoto() { ... }
const savePhotoAsync = async () => { ... }
```

### Error Codes
```typescript
// Pattern: SCREAMING_SNAKE_CASE
export enum PhotoErrorCode {
  CAMERA_PERMISSION_DENIED = 'CAMERA_PERMISSION_DENIED',
  PHOTO_SAVE_FAILED = 'PHOTO_SAVE_FAILED',
  STORAGE_ERROR = 'STORAGE_ERROR',
}
```

---

## 4. Error Handling Standards

### All Errors Must Be Typed
```typescript
// ✅ GOOD: Specific error type
async function savePhoto(photo) {
  try {
    return await photoService.savePhoto(photo)
  } catch (error) {
    const photoError = error as PhotoError  // ← Typed
    setError(photoError)
    console.error('Save failed:', photoError)
  }
}

// ❌ BAD: Generic error
catch (error) {
  setError(error)  // Type is unknown
}
```

### User-Facing Messages Come from Errors
```typescript
// ✅ GOOD: Error provides user message
if (storageError) {
  Alert.alert('Error', storageError.getUserMessage())
}

// ❌ BAD: Generic message
Alert.alert('Error', 'Something went wrong')
```

### Always Log Errors to Console
```typescript
// ✅ GOOD: Log for debugging
catch (error) {
  console.error('Photo capture failed:', {
    code: error.code,
    message: error.message,
    context: error.context,
  })
}
```

### Three-Level Error Response
```typescript
// Level 1: Log to console (developers)
console.error('Technical details:', error)

// Level 2: Set error state (internal)
setError(error)

// Level 3: Show to user (UI)
Alert.alert('Error', error.getUserMessage())
```

---

## 5. How to Add a Feature

### Example: Add Date Filtering

**Step 1: Service Layer**
```typescript
// src/services/PhotoService.ts
async getPhotosByDateRange(start: string, end: string): Promise<CapturedPhoto[]> {
  try {
    const result = db.getAllSync(
      'SELECT * FROM photos WHERE capturedAt BETWEEN ? AND ? ORDER BY capturedAt DESC',
      [start, end]
    )
    return result as CapturedPhoto[]
  } catch (error) {
    throw new PhotoError(DATABASE_ERROR, 'Failed to filter by date', { start, end, error })
  }
}
```

**Step 2: Hook (if reusable)**
```typescript
// src/hooks/usePhotoFilter.ts
export function usePhotoFilter() {
  const filterByDateRange = useCallback(async (start, end) => {
    try {
      return await photoService.getPhotosByDateRange(start, end)
    } catch (error) {
      console.error('Filter error:', error)
      throw error
    }
  }, [])
  
  return { filterByDateRange }
}
```

**Step 3: Component**
```typescript
// Update existing component to use hook
function PhotoScreen() {
  const { photos } = usePhotoList()
  const { filterByDateRange } = usePhotoFilter()
  
  const [filtered, setFiltered] = useState(photos)
  
  const handleDateFilter = async (start, end) => {
    const result = await filterByDateRange(start, end)
    setFiltered(result)
  }
  
  return (
    <View>
      <DateRangeInput onFilter={handleDateFilter} />
      <PhotoList photos={filtered} />
    </View>
  )
}
```

**Step 4: Tests**
```typescript
// __tests__/services/PhotoService.test.ts
describe('PhotoService.getPhotosByDateRange', () => {
  it('should return photos in date range', async () => {
    const result = await photoService.getPhotosByDateRange('2026-01-01', '2026-12-31')
    expect(result).toHaveLength(expectedCount)
  })
})
```

**Key Points:**
- ✅ No business logic in component
- ✅ Service handles DB query
- ✅ Hook wraps service call
- ✅ Error handling in place
- ✅ Tests written

---

## 6. Code Review Checklist

Before merging, **all items** must pass:

### Architecture
- [ ] No business logic in components?
- [ ] All async calls through services?
- [ ] All errors typed and handled?
- [ ] Follows folder structure?
- [ ] No direct FileSystem/DB calls outside services?

### Code Quality
- [ ] TypeScript types complete?
- [ ] No `any` types (use specific types)?
- [ ] Functions < 50 lines?
- [ ] Components < 100 lines?
- [ ] No console.log in production code?

### Testing
- [ ] Tests written for service/hook changes?
- [ ] Error cases covered?
- [ ] All error paths tested?

### Documentation
- [ ] Complicated logic has comments?
- [ ] New features documented in ARCHITECTURE.md?
- [ ] ADR created if architectural decision?

### Performance
- [ ] No unnecessary re-renders?
- [ ] useCallback/useMemo used appropriately?
- [ ] Large lists use FlatList virtualization?

---

## 7. Example: PR Review

### PR: "Add GPS tagging"

**Reviewer's Checklist:**

1. ✅ **Service Created:** `GPSService` with `captureLocationAsync()`
2. ✅ **Hook Created:** `useGPSCapture()` with error handling
3. ✅ **Component Untouched:** No changes to `CameraView.tsx`
4. ✅ **Types Extended:** `CapturedPhoto` has `latitude`, `longitude`
5. ✅ **Errors Defined:** New error codes in `PhotoErrors.ts`
6. ✅ **Migrations:** Old photos have null lat/lng
7. ✅ **Tests:** GPS capture tested, errors covered

**Comment Examples:**
```
✅ "Good separation - GPS logic in service, not component"

❌ "This hook has 80 lines - extract GPS business logic to service"

✅ "Nice - all FileSystem calls still go through StorageService"

❌ "Missing error type - use specific PhotoError not generic Error"
```

---

## 8. Performance Checklist

### Don't Do This
```typescript
// ❌ BAD: Recreates function on every render
<Button onPress={() => deletePhoto(id)} />

// ❌ BAD: Unnecessary dependency
useEffect(() => { ... }, [photos, onDelete, modalVisible, ...])

// ❌ BAD: FlatList without virtualization
<FlatList data={1000Photos} />  // Renders all 1000 items at once
```

### Do This Instead
```typescript
// ✅ GOOD: Wrapped in useCallback
const handleDelete = useCallback((id) => deletePhoto(id), [])
<Button onPress={() => handleDelete(id)} />

// ✅ GOOD: Only depends on data changes
useEffect(() => { ... }, [pendingCapture])

// ✅ GOOD: FlatList is virtualized by default
<FlatList data={1000Photos} keyExtractor={item => item.id} />
```

---

## 9. When to Create an ADR

Create an Architecture Decision Record (in `docs/adr/`) when:
- ✅ Making a technology choice (library, framework, approach)
- ✅ Changing a core pattern
- ✅ Making a trade-off that affects the team
- ❌ Don't create for bug fixes or small improvements

**Template:**
```markdown
# ADR-NNN: [Decision Title]

**Date:** YYYY-MM-DD  
**Status:** PROPOSED | ACCEPTED | SUPERSEDED  

## Context
(Why are we making this decision?)

## Decision
(What are we deciding?)

## Rationale
(Why this over alternatives?)

## Consequences
(What are the positive/negative effects?)

## Alternatives Considered
(What else did we think about?)
```

---

## 10. Communication

### Slack/Messages About Code
- Link to specific line: `/code src/services/PhotoService.ts:45`
- Link to PR comments
- Always include: what, why, what to change

### Comment Code
Comment **why**, not **what**:
```typescript
// ❌ BAD: Comments describe what code does (obvious)
// Increment counter by 1
counter++

// ✅ GOOD: Comments explain why
// Increment here because we need to skip the first photo
counter++

// ❌ BAD: Too long
// This is a very complex algorithm that does foo, bar, baz
// See ticket #123 for more info

// ✅ GOOD: Short and specific
// Atomic delete: DB first, then FileSystem (see ADR-003)
```

---

## 11. Team Decision Log

When the team makes a decision, document it:

| Date | Decision | Owner | Status |
|------|----------|-------|--------|
| 2026-06-21 | Use SQLite over AsyncStorage | Architecture | ✅ Accepted |
| 2026-06-21 | Custom Hooks for state mgmt | Architecture | ✅ Accepted |

---

## 12. Escalation Path

**Question about code standards?**
1. Check TEAM_STANDARDS.md
2. Check ARCHITECTURE.md
3. Check ADRs in `docs/adr/`
4. Ask tech lead

**Want to propose a change?**
1. Create an ADR draft
2. Discussion in team meeting
3. Vote to accept/reject/modify

---

## Summary

**The Team Oath:**
- ✅ Keep components simple (UI only)
- ✅ Keep logic in services (testable)
- ✅ Keep errors typed (user-friendly)
- ✅ Keep code readable (for next person)
- ✅ Keep tests written (confidence)
- ✅ Keep docs updated (for future you)

**When in doubt, ask: "Where does this logic belong?"**
- Components: Never
- Hooks: Only if reusable
- Services: Most of the time
- Database: Data persistence only
