
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

const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<HeroesDB>(DB_NAME, 2, {
      upgrade(db, oldVersion, newVersion, transaction) {
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

export const StorageService = {
  // --- HEROES ---
  async saveHero(persona: Persona): Promise<void> {
    if (!persona.name) return;
    const db = await initDB();
    const id = persona.name.toLowerCase().replace(/\s+/g, '-');
    await db.put(STORE_HEROES, {
      ...persona,
      id,
      timestamp: Date.now()
    });
  },

  async getHeroes(): Promise<(Persona & { id: string })[]> {
    const db = await initDB();
    const all = await db.getAll(STORE_HEROES);
    return all.sort((a, b) => b.timestamp - a.timestamp);
  },

  // --- WORLDS ---
  async saveWorld(world: World): Promise<void> {
    const db = await initDB();
    await db.put(STORE_WORLDS, {
      ...world,
      timestamp: Date.now()
    });
  },

  async getWorlds(): Promise<World[]> {
    const db = await initDB();
    const all = await db.getAll(STORE_WORLDS);
    return all.sort((a, b) => b.timestamp - a.timestamp);
  },

  async deleteWorld(id: string): Promise<void> {
    const db = await initDB();
    await db.delete(STORE_WORLDS, id);
  }
};
