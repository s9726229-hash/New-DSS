import { afterEach, expect, test } from 'vitest';
import { deleteDB } from 'idb';
import {
  createCompleteBackup,
  createLightweightExport,
  restoreBackup,
} from './backup';
import { openDssDatabase } from './database';

afterEach(async () => {
  await deleteDB('new-dss');
});

async function seedLocalData() {
  const db = await openDssDatabase();

  await db.put('settings', { key: 'theme', value: 'system' });
  await db.put('marketCache', {
    id: 'TaiwanStockPrice:2330:2026-07-24',
    dataset: 'TaiwanStockPrice',
    tradeDate: '2026-07-24',
    retrievedAt: '2026-07-26T06:00:00.000Z',
    payload: { stockId: '2330', close: 1000 },
  });

  return db;
}

test('complete backup contains market cache but never an API credential', async () => {
  const db = await seedLocalData();

  const backup = await createCompleteBackup();

  expect(backup.marketCache).toHaveLength(1);
  expect(JSON.stringify(backup)).not.toMatch(/apiKey|token|finmind/i);
  db.close();
});

test('lightweight export excludes market cache', async () => {
  const db = await seedLocalData();

  const backup = await createLightweightExport();

  expect('marketCache' in backup).toBe(false);
  db.close();
});

test('rejects a credential-bearing import before it changes local data', async () => {
  const db = await seedLocalData();

  try {
    await expect(
      restoreBackup({
        version: 1,
        createdAt: '2026-07-26T06:00:00.000Z',
        settings: [{ key: 'apiKey', value: 'must-not-import' }],
        transactions: [],
        marketCache: [],
        researchSnapshots: [],
      }),
    ).rejects.toThrow('備份不得包含 API Key 或其他憑證');

    await expect(db.get('settings', 'theme')).resolves.toEqual({
      key: 'theme',
      value: 'system',
    });
  } finally {
    db.close();
  }
});
