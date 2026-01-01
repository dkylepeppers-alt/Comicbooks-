
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ModelPreset, Persona, World } from '../types';

// Custom error class for permission-related errors
class PermissionError extends Error {
  constructor(message: string, public readonly resource: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

interface HeroesDB extends DBSchema {
  heroes: {
    key: string;
    value: Persona & { id: string; timestamp: number };
  };
  worlds: {
    key: string;
    value: World & { timestamp: number };
  };
  presets: {
    key: string;
    value: ModelPreset;
  };
  connections: {
    key: string;
    value: { handle: FileSystemDirectoryHandle; timestamp: number };
  };
}

const DB_NAME = 'infinite-heroes-db';
const STORE_HEROES = 'heroes';
const STORE_WORLDS = 'worlds';
const STORE_PRESETS = 'presets';
const STORE_CONNECTIONS = 'connections';

let dbPromise: Promise<IDBPDatabase<HeroesDB>>;
let rootHandle: any | null = null; // FileSystemDirectoryHandle

// Storage caches to reduce repeated reads
// Note: Module-level caching is intentional for:
// 1. Simplicity: Single source of truth across all storage calls
// 2. Performance: No overhead from cache class instantiation
// 3. Singleton pattern: Storage service is effectively a singleton
// Cache is invalidated automatically on writes and has TTL for freshness
let charactersCache: (Persona & { id: string; timestamp: number })[] | null = null;
let charactersCacheTimestamp = 0;
let worldsCache: (World & { timestamp: number })[] | null = null;
let worldsCacheTimestamp = 0;
let presetsCache: ModelPreset[] | null = null;
let presetsCacheTimestamp = 0;

const CACHE_TTL = 30000; // 30 seconds cache validity

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_TTL;
};

const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<HeroesDB>(DB_NAME, 4, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(STORE_HEROES)) {
          db.createObjectStore(STORE_HEROES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_WORLDS)) {
          db.createObjectStore(STORE_WORLDS, { keyPath: 'id' });
        }
        if (oldVersion < 3 && !db.objectStoreNames.contains(STORE_PRESETS)) {
          db.createObjectStore(STORE_PRESETS, { keyPath: 'id' });
        }
        if (oldVersion < 4 && !db.objectStoreNames.contains(STORE_CONNECTIONS)) {
          db.createObjectStore(STORE_CONNECTIONS, { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
};

// --- FILE SYSTEM HELPERS ---
const getSubDir = async (name: string) => {
  if (!rootHandle) return null;
  try {
    return await rootHandle.getDirectoryHandle(name, { create: true });
  } catch (e) {
    console.error(`FS Error getting subdir "${name}":`, e);
    // Check if it's a permission error using proper type checking
    if (e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) {
      // Permission denied - throw custom error to let caller handle
      throw new PermissionError(`Permission denied accessing "${name}" directory. Please reconnect your library.`, name);
    }
    // For other errors, return null to fall back to IndexedDB
    return null;
  }
};

const writeToFile = async (dirHandle: any, filename: string, content: any) => {
    try {
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(content, null, 2));
        await writable.close();
    } catch (e) {
        console.error("FS Write Error", e);
    }
};

const hasPermission = async (handle: FileSystemDirectoryHandle) => {
    try {
        const permission = await handle.queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') return true;
        if (permission === 'denied') return false;
        return (await handle.requestPermission({ mode: 'readwrite' })) === 'granted';
    } catch (e) {
        console.error("Failed to check or request file system permissions", e);
        return false;
    }
};

const readFiles = async <T>(dirHandle: any): Promise<T[]> => {
    const results: T[] = [];
    try {
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                try {
                    const file = await entry.getFile();
                    const text = await file.text();
                    const json = JSON.parse(text);
                    results.push(json);
                } catch (e) {
                    console.warn(`Failed to read or parse file ${entry.name}:`, e);
                }
            }
        }
    } catch (e) {
        console.error("FS Read Error", e);
        throw e; // Propagate error so caller knows something went wrong
    }
    return results;
};

const ensureBaseStructure = async (handle: FileSystemDirectoryHandle) => {
  try {
    await handle.getDirectoryHandle('characters', { create: true });
    await handle.getDirectoryHandle('worlds', { create: true });
    await handle.getDirectoryHandle('presets', { create: true });
    return true;
  } catch (e) {
    console.error('Failed to prepare base folder structure', e);
    return false;
  }
};

const persistConnectionHandle = async (handle: FileSystemDirectoryHandle) => {
  try {
    const db = await initDB();
    await db.put(STORE_CONNECTIONS, { key: 'library-root', handle, timestamp: Date.now() });
  } catch (e) {
    console.warn('Connected to library but failed to persist handle. You may need to reconnect after reload.', e);
  }
};

const verifyHandle = async (handle: FileSystemDirectoryHandle | null | undefined) => {
  if (!handle) return false;
  const hasAccess = await hasPermission(handle);
  if (!hasAccess) return false;
  return ensureBaseStructure(handle);
};

export const StorageService = {
  // --- CONNECTION ---
  async connectLocalLibrary(): Promise<boolean> {
    if (!('showDirectoryPicker' in window)) {
        alert("Your browser does not support local file access. Using internal storage.");
        return false;
    }
    try {
        const handle = await (window as any).showDirectoryPicker();
        const hasAccess = await verifyHandle(handle);
        if (!hasAccess) {
          alert('Could not get permission to that folder. Please try again.');
          return false;
        }

        rootHandle = handle;
        await persistConnectionHandle(handle);
        return true;
    } catch (e) {
        console.log("User cancelled folder picker or error", e);
        return false;
    }
  },

  isLocalConnected: () => !!rootHandle,

  async restoreLocalLibrary(): Promise<boolean> {
    try {
        const db = await initDB();
        const saved = await db.get(STORE_CONNECTIONS, 'library-root');
        if (saved?.handle && await verifyHandle(saved.handle)) {
            rootHandle = saved.handle;
            return true;
        }
    } catch (e) {
        console.warn('Unable to restore library connection', e);
    }
    return false;
  },

  async disconnectLibrary(): Promise<void> {
    const db = await initDB();
    await db.delete(STORE_CONNECTIONS, 'library-root');
    rootHandle = null;
  },

  async verifyActiveConnection(): Promise<boolean> {
    if (!rootHandle) return false;
    const stillValid = await verifyHandle(rootHandle);
    if (!stillValid) {
      await this.disconnectLibrary();
    }
    return stillValid;
  },

  // --- CHARACTERS ---
  async saveCharacter(persona: Persona, existingId?: string): Promise<void> {
    if (!persona.name) return;
    // Use existing ID for updates, or generate new one for new characters
    const id = existingId || persona.name.toLowerCase().replace(/\s+/g, '-');
    const data = { ...persona, id, timestamp: Date.now() };

    // Invalidate cache
    charactersCache = null;
    charactersCacheTimestamp = 0;

    // 1. Try File System
    if (rootHandle) {
        const dir = await getSubDir('characters');
        if (dir) {
            await writeToFile(dir, `${id}.json`, data);
            return;
        }
    }

    // 2. Fallback IDB
    const db = await initDB();
    await db.put(STORE_HEROES, data);
  },

  async deleteCharacter(id: string): Promise<void> {
    // Invalidate cache
    charactersCache = null;
    charactersCacheTimestamp = 0;
    
    // Try file system
    if (rootHandle) {
        const dir = await getSubDir('characters');
        if (dir) {
            try {
                await dir.removeEntry(`${id}.json`);
            } catch (e) { console.warn("FS Delete error", e); }
        }
    }
    
    // Also delete from IDB
    const db = await initDB();
    await db.delete(STORE_HEROES, id);
  },

  async getCharacters(): Promise<(Persona & { id: string })[]> {
    // Check cache first
    if (charactersCache && isCacheValid(charactersCacheTimestamp)) {
      return charactersCache;
    }

    let fsItems: any[] = [];
    let idbItems: any[] = [];
    let idbError: unknown = null;
    let fsError: unknown = null;

    // 1. Try File System
    if (rootHandle) {
        try {
            const dir = await getSubDir('characters');
            if (dir) {
              fsItems = await readFiles(dir);
            } else {
              console.warn("Could not access characters directory from file system, falling back to IndexedDB");
            }
        } catch (e) {
            console.error("Failed to read characters from file system:", e);
            fsError = e;
            // If it's a permission error, we should propagate it but still try IDB
            if (e instanceof PermissionError) {
              console.warn("File system permission lost. Attempting to read from IndexedDB backup.");
            }
        }
    }

    // 2. Always read from IndexedDB to merge both sources
    try {
        const db = await initDB();
        idbItems = await db.getAll(STORE_HEROES);
    } catch (e) {
        console.error("Failed to read characters from IndexedDB:", e);
        idbError = e;
    }

    // 3. Validate and normalize all items
    const validateAndNormalize = (item: any): (Persona & { id: string; timestamp: number }) | null => {
        // Must have a name at minimum
        if (!item?.name || typeof item.name !== 'string') {
            console.warn("Skipping character with missing or invalid name:", item);
            return null;
        }

        // Generate ID if missing
        const id = item.id || item.name.toLowerCase().replace(/\s+/g, '-');

        // Ensure required Persona fields exist
        if (!item.base64 || typeof item.base64 !== 'string') {
            console.warn(`Skipping character "${item.name}" - missing or invalid base64 image`);
            return null;
        }

        return {
            id,
            name: item.name,
            description: item.description || '',
            base64: item.base64,
            images: item.images || undefined, // Preserve images array if it exists
            timestamp: item.timestamp || 0
        };
    };

    // 4. Merge and deduplicate (File System takes precedence over IDB)
    const mergedMap = new Map<string, Persona & { id: string; timestamp: number }>();

    // Add IDB items first
    idbItems.forEach(item => {
        const normalized = validateAndNormalize(item);
        if (normalized) {
            mergedMap.set(normalized.id, normalized);
        }
    });

    // File System items override IDB items (newer versions)
    fsItems.forEach(item => {
        const normalized = validateAndNormalize(item);
        if (normalized) {
            mergedMap.set(normalized.id, normalized);
        }
    });

    const items = Array.from(mergedMap.values());

    // If both sources failed and we have no items, throw the most relevant error
    if (!items.length) {
      if (fsError && idbError) {
        throw new Error('Failed to load characters from both file system and local storage. Please check permissions and try reconnecting your library.');
      } else if (fsError && rootHandle) {
        // File system failed but IDB succeeded (though returned no items)
        console.warn('File system access failed, using IndexedDB only');
        if (fsError instanceof PermissionError) {
          throw new Error('Lost access to your library folder. Please reconnect to restore file system characters.');
        }
      } else if (idbError) {
        throw idbError;
      }
    }

    const sortedItems = items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    // Update cache
    charactersCache = sortedItems;
    charactersCacheTimestamp = Date.now();

    return sortedItems;
  },

  // --- WORLDS ---
  async saveWorld(world: World): Promise<void> {
    const data = { ...world, timestamp: Date.now() };

    // Invalidate cache
    worldsCache = null;
    worldsCacheTimestamp = 0;

    if (rootHandle) {
        const dir = await getSubDir('worlds');
        if (dir) {
            await writeToFile(dir, `${world.id}.json`, data);
            return;
        }
    }

    const db = await initDB();
    await db.put(STORE_WORLDS, data);
  },

  async getWorlds(): Promise<World[]> {
    // Check cache first
    if (worldsCache && isCacheValid(worldsCacheTimestamp)) {
      return worldsCache;
    }

    let fsItems: any[] = [];
    let idbItems: any[] = [];
    let idbError: unknown = null;
    let fsError: unknown = null;

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
            fsError = e;
            // If it's a permission error, we should propagate it but still try IDB
            if (e instanceof PermissionError) {
              console.warn("File system permission lost. Attempting to read from IndexedDB backup.");
            }
        }
    }

    // 2. Always read from IndexedDB to merge both sources
    try {
        const db = await initDB();
        idbItems = await db.getAll(STORE_WORLDS);
    } catch (e) {
        console.error("Failed to read worlds from IndexedDB:", e);
        idbError = e;
    }

    // 3. Validate and normalize all items
    const validateAndNormalize = (item: any): (World & { timestamp: number }) | null => {
        // Must have required fields
        if (!item?.id || !item?.name || typeof item.id !== 'string' || typeof item.name !== 'string') {
            console.warn("Skipping world with missing or invalid id/name:", item);
            return null;
        }

        return {
            id: item.id,
            name: item.name,
            description: item.description || '',
            images: Array.isArray(item.images) ? item.images : [],
            linkedPersonaIds: Array.isArray(item.linkedPersonaIds) ? item.linkedPersonaIds : [],
            timestamp: item.timestamp || 0
        };
    };

    // 4. Merge and deduplicate (File System takes precedence over IDB)
    const mergedMap = new Map<string, World & { timestamp: number }>();

    // Add IDB items first
    idbItems.forEach(item => {
        const normalized = validateAndNormalize(item);
        if (normalized) {
            mergedMap.set(normalized.id, normalized);
        }
    });

    // File System items override IDB items (newer versions)
    fsItems.forEach(item => {
        const normalized = validateAndNormalize(item);
        if (normalized) {
            mergedMap.set(normalized.id, normalized);
        }
    });

    const items = Array.from(mergedMap.values());

    // If both sources failed and we have no items, throw the most relevant error
    if (!items.length) {
      if (fsError && idbError) {
        throw new Error('Failed to load worlds from both file system and local storage. Please check permissions and try reconnecting your library.');
      } else if (fsError && rootHandle) {
        // File system failed but IDB succeeded (though returned no items)
        console.warn('File system access failed, using IndexedDB only');
        if (fsError instanceof PermissionError) {
          throw new Error('Lost access to your library folder. Please reconnect to restore file system worlds.');
        }
      } else if (idbError) {
        throw idbError;
      }
    }

    const sortedItems = items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    // Update cache
    worldsCache = sortedItems;
    worldsCacheTimestamp = Date.now();

    return sortedItems;
  },

  async deleteWorld(id: string): Promise<void> {
    // Invalidate cache
    worldsCache = null;
    worldsCacheTimestamp = 0;
    if (rootHandle) {
        const dir = await getSubDir('worlds');
        if (dir) {
            try {
                await dir.removeEntry(`${id}.json`);
            } catch (e) { console.warn("FS Delete error", e); }
        }
    }
    const db = await initDB();
    await db.delete(STORE_WORLDS, id);
  },

  // --- MODEL PRESETS ---
  async saveModelPreset(preset: ModelPreset): Promise<void> {
    const payload = { ...preset, updatedAt: preset.updatedAt || Date.now() };

    // Invalidate cache
    presetsCache = null;
    presetsCacheTimestamp = 0;

    if (rootHandle) {
        const dir = await getSubDir('presets');
        if (dir) {
            await writeToFile(dir, `${payload.id}.json`, payload);
        }
    }

    const db = await initDB();
    await db.put(STORE_PRESETS, payload);
  },

  async getModelPresets(): Promise<ModelPreset[]> {
    // Check cache first
    if (presetsCache && isCacheValid(presetsCacheTimestamp)) {
      return presetsCache;
    }

    let fsItems: ModelPreset[] = [];
    let idbItems: ModelPreset[] = [];
    let idbError: unknown = null;
    let fsError: unknown = null;

    if (rootHandle) {
        try {
            const dir = await getSubDir('presets');
            if (dir) {
              fsItems = await readFiles<ModelPreset>(dir);
            } else {
              console.warn("Could not access presets directory from file system, falling back to IndexedDB");
            }
        } catch (e) {
            console.error('Failed to read presets from file system:', e);
            fsError = e;
            if (e instanceof PermissionError) {
              console.warn("File system permission lost. Attempting to read from IndexedDB backup.");
            }
        }
    }

    try {
        const db = await initDB();
        idbItems = await db.getAll(STORE_PRESETS);
    } catch (e) {
        console.error('Failed to read presets from IndexedDB:', e);
        idbError = e;
    }

    const normalize = (item: any): ModelPreset | null => {
        if (!item?.id || !item?.name || !item?.model) return null;
        return {
            id: String(item.id),
            name: String(item.name),
            model: String(item.model),
            prompt: String(item.prompt || ''),
            isDefault: Boolean(item.isDefault),
            updatedAt: Number(item.updatedAt || 0),
        };
    };

    const mergedMap = new Map<string, ModelPreset>();
    idbItems.forEach((item) => {
        const normalized = normalize(item);
        if (normalized) mergedMap.set(normalized.id, normalized);
    });
    fsItems.forEach((item) => {
        const normalized = normalize(item);
        if (normalized) mergedMap.set(normalized.id, normalized);
    });

    const items = Array.from(mergedMap.values());
    
    // If both sources failed and we have no items, throw the most relevant error
    if (!items.length) {
      if (fsError && idbError) {
        throw new Error('Failed to load presets from both file system and local storage. Please check permissions and try reconnecting your library.');
      } else if (fsError && rootHandle) {
        // File system failed but IDB succeeded (though returned no items)
        console.warn('File system access failed, using IndexedDB only');
        if (fsError instanceof PermissionError) {
          throw new Error('Lost access to your library folder. Please reconnect to restore file system presets.');
        }
      } else if (idbError) {
        throw idbError;
      }
    }

    const sortedItems = items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    
    // Update cache
    presetsCache = sortedItems;
    presetsCacheTimestamp = Date.now();

    return sortedItems;
  },

  async deleteModelPreset(id: string): Promise<void> {
    // Invalidate cache
    presetsCache = null;
    presetsCacheTimestamp = 0;
    if (rootHandle) {
        const dir = await getSubDir('presets');
        if (dir) {
            try {
                await dir.removeEntry(`${id}.json`);
            } catch (e) { console.warn('FS Delete error', e); }
        }
    }
    const db = await initDB();
    await db.delete(STORE_PRESETS, id);
  }
};
