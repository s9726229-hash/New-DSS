import { openDB, type IDBPDatabase } from 'idb';
import type { DssDatabase } from '../domain/types';

export function openDssDatabase(): Promise<IDBPDatabase<DssDatabase>> {
  return openDB<DssDatabase>('new-dss', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('settings', { keyPath: 'key' });
        db.createObjectStore('transactions', { keyPath: 'id' });
        db.createObjectStore('marketCache', { keyPath: 'id' });
        db.createObjectStore('researchSnapshots', { keyPath: 'id' });
      }

      if (oldVersion < 2) {
        db.createObjectStore('holdingsSnapshots', { keyPath: 'id' });
      }
    },
  });
}
