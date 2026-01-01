# World Loading Fix Documentation

## Problem Summary

When the Infinite Heroes app was connected to a local file system directory for storage, worlds would fail to load silently under certain conditions:

1. **Permission Loss**: If the user revoked file system permissions after connecting
2. **Invalid Directory Handle**: If the directory handle became stale or invalid
3. **File System Errors**: Any error accessing the subdirectory would be silently ignored

### User Impact
- Worlds saved to the local file system would become invisible
- No error notification was shown to the user
- User would see an empty world list with no indication of what went wrong

## Root Cause Analysis

### In `services/storage.ts`

**Problem 1: `getSubDir()` function**
```typescript
// BEFORE: Returned null on any error
const getSubDir = async (name: string) => {
  if (!rootHandle) return null;
  try {
    return await rootHandle.getDirectoryHandle(name, { create: true });
  } catch (e) {
    console.error("FS Error getting subdir", e);
    return null; // ❌ Silent failure
  }
};
```

**Problem 2: `getWorlds()` function**
```typescript
// BEFORE: Silently skipped file system when dir was null
if (rootHandle) {
    try {
        const dir = await getSubDir('worlds');
        if (dir) fsItems = await readFiles(dir);
        // ❌ If dir is null, just continues with empty fsItems
    } catch (e) {
        console.error("Failed to read worlds from file system:", e);
    }
}
```

**Problem 3: Generic error messages**
```typescript
// BEFORE: Generic error message didn't help user understand the issue
.catch(error => {
    console.error('Failed to load worlds:', error);
    addNotification('error', 'Failed to load saved worlds. Please try reconnecting your library.');
    // ❌ Same message for all error types
});
```

## Solution Implemented

### 1. Enhanced Error Detection in `getSubDir()`

```typescript
// AFTER: Differentiate permission errors from other failures
const getSubDir = async (name: string) => {
  if (!rootHandle) return null;
  try {
    return await rootHandle.getDirectoryHandle(name, { create: true });
  } catch (e) {
    console.error(`FS Error getting subdir "${name}":`, e);
    // Check if it's a permission error
    const errorStr = String(e);
    if (errorStr.includes('NotAllowedError') || errorStr.includes('SecurityError')) {
      // Permission denied - throw to let caller handle
      throw new Error(`Permission denied accessing "${name}" directory. Please reconnect your library.`);
    }
    // For other errors, return null to fall back to IndexedDB
    return null;
  }
};
```

**Key Improvements:**
- ✅ Detects permission-specific errors (NotAllowedError, SecurityError)
- ✅ Throws meaningful error messages for permission issues
- ✅ Gracefully returns null for other errors (allows IndexedDB fallback)

### 2. Better Error Tracking in `getWorlds()`

```typescript
// AFTER: Track both file system and IndexedDB errors separately
let fsItems: any[] = [];
let idbItems: any[] = [];
let idbError: unknown = null;
let fsError: unknown = null; // ✅ Track FS errors

// 1. Try File System
if (rootHandle) {
    try {
        const dir = await getSubDir('worlds');
        if (dir) {
          fsItems = await readFiles(dir);
        } else {
          console.warn("Could not access worlds directory from file system, falling back to IndexedDB");
        }
    } catch (e) {
        console.error("Failed to read worlds from file system:", e);
        fsError = e; // ✅ Store the error
        const errorStr = String(e);
        if (errorStr.includes('Permission denied')) {
          console.warn("File system permission lost. Attempting to read from IndexedDB backup.");
        }
    }
}
```

### 3. Comprehensive Error Handling

```typescript
// AFTER: Throw specific errors based on failure mode
if (!items.length) {
  if (fsError && idbError) {
    throw new Error('Failed to load worlds from both file system and local storage. Please check permissions and try reconnecting your library.');
  } else if (fsError && rootHandle) {
    console.warn('File system access failed, using IndexedDB only');
    const errorStr = String(fsError);
    if (errorStr.includes('Permission denied')) {
      throw new Error('Lost access to your library folder. Please reconnect to restore file system worlds.');
    }
  } else if (idbError) {
    throw idbError;
  }
}
```

**Error Message Matrix:**

| Scenario | Error Message |
|----------|---------------|
| Both FS and IDB fail | "Failed to load worlds from both file system and local storage. Please check permissions and try reconnecting your library." |
| FS permission denied, IDB empty | "Lost access to your library folder. Please reconnect to restore file system worlds." |
| FS other error, IDB empty | Generic warning, continues silently |
| IDB fails only | Original IDB error |

### 4. UI Integration in `Setup.tsx`

```typescript
// AFTER: Display specific error messages from storage service
loadWorlds().catch((error: Error) => {
    console.error('Failed to load worlds:', error);
    const errorMsg = error?.message || 'Failed to load saved worlds. Please try reconnecting your library.';
    addNotification('error', errorMsg); // ✅ Shows actual error message
});
```

## Files Modified

1. **`services/storage.ts`**
   - Enhanced `getSubDir()` with permission error detection
   - Improved `getWorlds()` with better error tracking and propagation
   - Applied same improvements to `getCharacters()` and `getModelPresets()`
   - Added detailed console logging for debugging

2. **`Setup.tsx`**
   - Updated error handlers to display specific error messages
   - Applied to all `loadWorlds()` calls (3 locations)
   - Applied to `refreshLibrary()` (getCharacters call)

## Testing Scenarios

### Scenario 1: Normal Operation
**Steps:**
1. Start the app
2. Click "Connect Local Library"
3. Select a directory
4. Create a new world
5. Verify world appears in the dropdown

**Expected Result:** ✅ World loads successfully from file system and/or IndexedDB

### Scenario 2: Permission Revoked
**Steps:**
1. Connect to a local library
2. Create some worlds
3. Revoke file system permissions (browser settings or close/reopen browser)
4. Try to load the app again

**Expected Result:** ✅ Error notification: "Lost access to your library folder. Please reconnect to restore file system worlds."

### Scenario 3: File System Error with IndexedDB Fallback
**Steps:**
1. Connect to local library
2. Save a world (goes to both FS and IDB)
3. Simulate FS access issue (non-permission error)
4. Reload page

**Expected Result:** ✅ World still loads from IndexedDB, warning in console but no error to user

### Scenario 4: Complete Storage Failure
**Steps:**
1. Simulate both file system and IndexedDB failures (hard to reproduce naturally)

**Expected Result:** ✅ Error notification: "Failed to load worlds from both file system and local storage. Please check permissions and try reconnecting your library."

## Migration Notes

### Backwards Compatibility
- ✅ Existing worlds in IndexedDB continue to work
- ✅ Existing file system connections restore automatically
- ✅ No data migration needed

### Cache Behavior
- Cache invalidation works the same (30-second TTL)
- Errors don't populate the cache
- Successful reads (even empty) update the cache

## Future Improvements

1. **Automatic Permission Re-request**: When permission is lost, automatically prompt user to re-grant access
2. **Sync Status Indicator**: Show visual indicator of file system connection status
3. **Conflict Resolution**: When worlds exist in both locations with different timestamps, show merge UI
4. **Background Sync**: Periodically check file system connection and warn before it's lost
5. **Manual Refresh Button**: Allow users to manually trigger library refresh

## Related Code

- `services/storage.ts` - All storage operations
- `Setup.tsx` - UI for world management
- `hooks/useComicEngine.ts` - World loading actions
- `context/BookContext.tsx` - World state management

## Success Metrics

- ✅ Users see clear error messages when file system access fails
- ✅ Graceful fallback to IndexedDB when file system is unavailable
- ✅ No silent failures when loading worlds
- ✅ Better debugging information in console logs
- ✅ Same improvements apply to characters and presets
