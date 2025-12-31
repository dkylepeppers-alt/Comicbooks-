
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Persona } from '../types';

interface HeroesDB extends DBSchema {
  heroes: {
    key: string;
    value: Persona & { id: string; timestamp: number };
  };
}

const DB_NAME = 'infinite-heroes-db';
const STORE_HEROES = 'heroes';

let dbPromise: Promise<IDBPDatabase<HeroesDB>>;

const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<HeroesDB>(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_HEROES)) {
          db.createObjectStore(STORE_HEROES, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const StorageService = {
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
  }
};
