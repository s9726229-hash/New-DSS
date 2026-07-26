import { afterEach, describe, expect, it } from 'vitest';
import { DATABASE_NAME, openDssDatabase } from './database';
import { cacheDataset, getCachedDataset } from './marketCache';

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

describe('cacheDataset / getCachedDataset', () => {
  it('round-trips rows for a dataset and stock id', async () => {
    const rows = [{ date: '2024-03-01', close: 100 }];

    await cacheDataset('TaiwanStockPriceAdj', '0050', rows, '2024-03-01T00:00:00.000Z');
    const cached = await getCachedDataset('TaiwanStockPriceAdj', '0050');

    expect(cached).toEqual(rows);
  });

  it('returns an empty array when nothing has been cached yet', async () => {
    const cached = await getCachedDataset('TaiwanStockPriceAdj', '9999');

    expect(cached).toEqual([]);
  });

  it('overwrites the previous cache entry for the same dataset and stock id', async () => {
    await cacheDataset('TaiwanStockPriceAdj', '0050', [{ date: '2024-03-01', close: 100 }], '2024-03-01T00:00:00.000Z');
    await cacheDataset('TaiwanStockPriceAdj', '0050', [{ date: '2024-03-02', close: 105 }], '2024-03-02T00:00:00.000Z');

    const cached = await getCachedDataset('TaiwanStockPriceAdj', '0050');

    expect(cached).toEqual([{ date: '2024-03-02', close: 105 }]);
  });

  it('keeps separate cache entries for different datasets on the same stock id', async () => {
    await cacheDataset('TaiwanStockPriceAdj', '0050', [{ date: '2024-03-01', close: 100 }], '2024-03-01T00:00:00.000Z');
    await cacheDataset(
      'TaiwanStockInstitutionalInvestorsBuySell',
      '0050',
      [{ date: '2024-03-01', netShares: 200, totalVolume: 1000 }],
      '2024-03-01T00:00:00.000Z',
    );

    const prices = await getCachedDataset('TaiwanStockPriceAdj', '0050');
    const institutional = await getCachedDataset('TaiwanStockInstitutionalInvestorsBuySell', '0050');

    expect(prices).toEqual([{ date: '2024-03-01', close: 100 }]);
    expect(institutional).toEqual([{ date: '2024-03-01', netShares: 200, totalVolume: 1000 }]);
  });
});
