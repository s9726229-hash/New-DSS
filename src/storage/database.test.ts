import { afterEach, expect, test } from 'vitest';
import { deleteDB } from 'idb';
import { openDssDatabase } from './database';

afterEach(async () => {
  await deleteDB('new-dss');
});

test('persists and reads an app setting', async () => {
  const db = await openDssDatabase();

  await db.put('settings', { key: 'theme', value: 'system' });

  await expect(db.get('settings', 'theme')).resolves.toEqual({
    key: 'theme',
    value: 'system',
  });

  db.close();
});
