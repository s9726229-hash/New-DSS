import { afterEach, describe, expect, it } from 'vitest';
import { DATABASE_NAME, openDssDatabase } from './database';

async function deleteDatabase(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}

afterEach(async () => {
  await deleteDatabase();
});

describe('openDssDatabase', () => {
  it('creates all four object stores', async () => {
    const db = await openDssDatabase();

    expect(db.objectStoreNames.contains('settings')).toBe(true);
    expect(db.objectStoreNames.contains('transactions')).toBe(true);
    expect(db.objectStoreNames.contains('holdingsSnapshots')).toBe(true);
    expect(db.objectStoreNames.contains('marketCache')).toBe(true);

    db.close();
  });

  it('round-trips a record through the settings store', async () => {
    const db = await openDssDatabase();

    await db.put('settings', { key: 'testKey', value: 42 });
    const stored = await db.get('settings', 'testKey');

    expect(stored).toEqual({ key: 'testKey', value: 42 });

    db.close();
  });
});
