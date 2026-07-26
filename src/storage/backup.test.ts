import { afterEach, describe, expect, it } from 'vitest';
import { DATABASE_NAME, openDssDatabase } from './database';
import { createCompleteBackup, createLightweightExport, restoreBackup } from './backup';
import type { BackupPayload } from './types';

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

describe('createCompleteBackup', () => {
  it('includes market cache and rejects a credential-shaped setting before returning', async () => {
    const db = await openDssDatabase();
    await db.put('settings', { key: 'watchCategoryOrder', value: ['PCB', '記憶體'] });
    await db.put('marketCache', {
      id: 'cache-1',
      dataset: 'TaiwanStockPriceAdj',
      stockId: '0050',
      tradeDate: '2024-03-01',
      retrievedAt: '2024-03-01T00:00:00.000Z',
      payload: { close: 100 },
    });
    db.close();

    const backup = await createCompleteBackup();

    expect(backup.marketCache).toHaveLength(1);
    expect(backup.settings).toEqual([
      { key: 'watchCategoryOrder', value: ['PCB', '記憶體'] },
    ]);
  });

  it('throws instead of returning a backup that contains an API key', async () => {
    const db = await openDssDatabase();
    await db.put('settings', { key: 'finmindApiKey', value: 'secret-token' });
    db.close();

    await expect(createCompleteBackup()).rejects.toThrow(/憑證/);
  });

  it('allows transactions with "secret" in stockName without throwing', async () => {
    const db = await openDssDatabase();
    await db.put('transactions', {
      id: 'tx-1',
      tradeDate: '2024-03-01',
      stockId: '2886',
      stockName: '秘密控股 Secret Holdings',
      side: 'buy',
      quantity: 100,
      price: 50,
      fees: 0,
      tax: 0,
      settlementDate: null,
      brokerReference: null,
      importedAt: '2024-03-01T00:00:00.000Z',
    });
    db.close();

    const backup = await createCompleteBackup();

    expect(backup.transactions).toHaveLength(1);
    expect(backup.transactions[0]).toEqual({
      id: 'tx-1',
      tradeDate: '2024-03-01',
      stockId: '2886',
      stockName: '秘密控股 Secret Holdings',
      side: 'buy',
      quantity: 100,
      price: 50,
      fees: 0,
      tax: 0,
      settlementDate: null,
      brokerReference: null,
      importedAt: '2024-03-01T00:00:00.000Z',
    });
  });
});

describe('createLightweightExport', () => {
  it('omits market cache but keeps everything else', async () => {
    const db = await openDssDatabase();
    await db.put('marketCache', {
      id: 'cache-1',
      dataset: 'TaiwanStockPriceAdj',
      stockId: '0050',
      tradeDate: '2024-03-01',
      retrievedAt: '2024-03-01T00:00:00.000Z',
      payload: { close: 100 },
    });
    await db.put('settings', { key: 'watchCategoryOrder', value: ['PCB'] });
    db.close();

    const lightweight = await createLightweightExport();

    expect(lightweight).not.toHaveProperty('marketCache');
    expect(lightweight.settings).toEqual([{ key: 'watchCategoryOrder', value: ['PCB'] }]);
  });
});

describe('restoreBackup', () => {
  function validPayload(): BackupPayload {
    return {
      version: 1,
      createdAt: '2024-03-01T00:00:00.000Z',
      settings: [{ key: 'watchCategoryOrder', value: ['PCB'] }],
      transactions: [],
      holdingsSnapshots: [],
      marketCache: [],
    };
  }

  it('replaces existing data with the payload contents', async () => {
    const db = await openDssDatabase();
    await db.put('settings', { key: 'stale', value: true });
    db.close();

    await restoreBackup(validPayload());

    const afterRestore = await openDssDatabase();
    const settings = await afterRestore.getAll('settings');
    afterRestore.close();

    expect(settings).toEqual([{ key: 'watchCategoryOrder', value: ['PCB'] }]);
  });

  it('rejects a payload containing an API key without touching stored data', async () => {
    const db = await openDssDatabase();
    await db.put('settings', { key: 'original', value: true });
    db.close();

    const payload = validPayload();
    payload.settings = [{ key: 'finmindApiKey', value: 'secret-token' }];

    await expect(restoreBackup(payload)).rejects.toThrow(/憑證/);

    const afterAttempt = await openDssDatabase();
    const settings = await afterAttempt.getAll('settings');
    afterAttempt.close();

    expect(settings).toEqual([{ key: 'original', value: true }]);
  });
});
