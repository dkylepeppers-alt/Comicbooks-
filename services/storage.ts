
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Persona, World } from '../types';

interface HeroesDB extends DBSchema {
  heroes: {
    key: string;
    value: Persona & { id: string; timestamp: number };
  };
  worlds: {
    key: string;
    value: World & { timestamp: number };
  };
}

const DB_NAME = 'infinite-heroes-db';
const STORE_HEROES = 'heroes'; 
const STORE_WORLDS = 'worlds';

let dbPromise: Promise<IDBPDatabase<HeroesDB>>;
let rootHandle: any | null = null; // FileSystemDirectoryHandle

const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<HeroesDB>(DB_NAME, 2, {
      upgrade(db, _oldVersion, _newVersion, _transaction) {
        if (!db.objectStoreNames.contains(STORE_HEROES)) {
          db.createObjectStore(STORE_HEROES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_WORLDS)) {
          db.createObjectStore(STORE_WORLDS, { keyPath: 'id' });
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

const readFiles = async <T>(dirHandle: any): Promise<T[]> => {
    const results: T[] = [];
    try {
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                const file = await entry.getFile();
                const text = await file.text();
                try {
                    const json = JSON.parse(text);
                    results.push(json);
                } catch (e) { console.warn("Invalid JSON", entry.name); }
            }
        }
    } catch (e) { console.error("FS Read Error", e); }
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
        return true;
    } catch (e) {
        console.log("User cancelled folder picker or error", e);
        return false;
    }
  },

  isLocalConnected: () => !!rootHandle,

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

    // 1. Try File System
    if (rootHandle) {
        const dir = await getSubDir('characters');
        if (dir) fsItems = await readFiles(dir);
    }

    // 2. Always read from IndexedDB to merge both sources
    const db = await initDB();
    idbItems = await db.getAll(STORE_HEROES);

    // 3. Merge and deduplicate (File System takes precedence over IDB)
    const mergedMap = new Map<string, any>();

    // Add IDB items first
    idbItems.forEach(item => mergedMap.set(item.id, item));

    // File System items override IDB items (newer versions)
    fsItems.forEach(item => mergedMap.set(item.id, item));

    const items = Array.from(mergedMap.values());

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

    // 1. Try File System
    if (rootHandle) {
        const dir = await getSubDir('worlds');
        if (dir) fsItems = await readFiles(dir);
    }

    // 2. Always read from IndexedDB to merge both sources
    const db = await initDB();
    idbItems = await db.getAll(STORE_WORLDS);

    // 3. Merge and deduplicate (File System takes precedence over IDB)
    const mergedMap = new Map<string, any>();

    // Add IDB items first
    idbItems.forEach(item => mergedMap.set(item.id, item));

    // File System items override IDB items (newer versions)
    fsItems.forEach(item => mergedMap.set(item.id, item));

    const items = Array.from(mergedMap.values());

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
  }
};
