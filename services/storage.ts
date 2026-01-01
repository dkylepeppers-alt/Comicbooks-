
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ModelPreset, Persona, World } from '../types';

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
        console.error("FS Error getting subdir", e);
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
        console.error("FS Permission Error", e);
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

export const StorageService = {
  // --- CONNECTION ---
  async connectLocalLibrary(): Promise<boolean> {
    if (!('showDirectoryPicker' in window)) {
        alert("Your browser does not support local file access. Using internal storage.");
        return false;
    }
    try {
        rootHandle = await (window as any).showDirectoryPicker();
        // Ensure structure
        await getSubDir('characters');
        await getSubDir('worlds');
        await getSubDir('presets');
        const db = await initDB();
        if (rootHandle) {
            await db.put(STORE_CONNECTIONS, { key: 'library-root', handle: rootHandle, timestamp: Date.now() });
        }
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
        if (saved?.handle && await hasPermission(saved.handle)) {
            rootHandle = saved.handle;
            await getSubDir('characters');
            await getSubDir('worlds');
            await getSubDir('presets');
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

  // --- CHARACTERS ---
  async saveCharacter(persona: Persona): Promise<void> {
    if (!persona.name) return;
    const id = persona.name.toLowerCase().replace(/\s+/g, '-');
    const data = { ...persona, id, timestamp: Date.now() };

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

  async getCharacters(): Promise<(Persona & { id: string })[]> {
    let fsItems: any[] = [];
    let idbItems: any[] = [];
    let idbError: unknown = null;

    // 1. Try File System
    if (rootHandle) {
        try {
            const dir = await getSubDir('characters');
            if (dir) fsItems = await readFiles(dir);
        } catch (e) {
            console.error("Failed to read characters from file system:", e);
            // Continue with IDB even if FS fails
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

    if (!items.length && idbError) {
        throw idbError;
    }

    return items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  },

  // --- WORLDS ---
  async saveWorld(world: World): Promise<void> {
    const data = { ...world, timestamp: Date.now() };

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
    let fsItems: any[] = [];
    let idbItems: any[] = [];
    let idbError: unknown = null;

    // 1. Try File System
    if (rootHandle) {
        try {
            const dir = await getSubDir('worlds');
            if (dir) fsItems = await readFiles(dir);
        } catch (e) {
            console.error("Failed to read worlds from file system:", e);
            // Continue with IDB even if FS fails
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

    if (!items.length && idbError) {
        throw idbError;
    }

    return items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  },

  async deleteWorld(id: string): Promise<void> {
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
    let fsItems: ModelPreset[] = [];
    let idbItems: ModelPreset[] = [];
    let idbError: unknown = null;

    if (rootHandle) {
        try {
            const dir = await getSubDir('presets');
            if (dir) fsItems = await readFiles<ModelPreset>(dir);
        } catch (e) {
            console.error('Failed to read presets from file system:', e);
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
    if (!items.length && idbError) {
        throw idbError;
    }

    return items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  },

  async deleteModelPreset(id: string): Promise<void> {
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
